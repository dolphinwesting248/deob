/**
 * SQLite database operations for code index.
 * Uses node:sqlite (Node 22+ built-in) — zero dependencies beyond the runtime.
 */
const { DatabaseSync } = require("node:sqlite");
const path = require("path");
const fs = require("fs");
const { SCHEMA_SQL } = require("./schema");

const DB_FILENAME = "index.db";

function dbPath(outputDir) {
  return path.join(outputDir, ".index", DB_FILENAME);
}

function openDatabase(dir) {
  const dirPath = path.join(dir, ".index");
  fs.mkdirSync(dirPath, { recursive: true });
  const dbFile = path.join(dirPath, DB_FILENAME);

  const db = new DatabaseSync(dbFile);
  db.exec("PRAGMA busy_timeout = 5000");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA synchronous = NORMAL");
  db.exec("PRAGMA cache_size = -16000");
  db.exec("PRAGMA temp_store = MEMORY");

  // Execute schema
  db.exec(SCHEMA_SQL);

  // Write .gitignore
  const giPath = path.join(dirPath, ".gitignore");
  if (!fs.existsSync(giPath)) {
    fs.writeFileSync(giPath, "*.db\n*.db-shm\n*.db-wal\n");
  }

  return db;
}

// ── prepared statements (created lazily) ─────────────────────────────

const STMTS = Symbol("stmts");

function prepare(db) {
  if (db[STMTS]) return db[STMTS];

  const s = {
    insertNode: db.prepare(`INSERT OR REPLACE INTO nodes
      (id, kind, name, qualified_name, file_path, language,
       start_line, end_line, start_column, end_column,
       docstring, signature, visibility,
       is_exported, is_async, is_static, is_abstract,
       metadata, decorators, type_parameters, return_type, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),

    insertEdge: db.prepare(`INSERT OR IGNORE INTO edges
      (source, target, kind, metadata, line, col, provenance)
      VALUES (?, ?, ?, ?, ?, ?, ?)`),

    upsertFile: db.prepare(`INSERT INTO files
      (path, content_hash, language, size, modified_at, indexed_at, node_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(path) DO UPDATE SET
        content_hash = excluded.content_hash,
        language = excluded.language,
        size = excluded.size,
        modified_at = excluded.modified_at,
        indexed_at = excluded.indexed_at,
        node_count = excluded.node_count`),

    insertSegment: db.prepare(`INSERT OR IGNORE INTO name_segment_vocab (segment, name) VALUES (?, ?)`),

    insertUnresolved: db.prepare(`INSERT INTO unresolved_refs
      (from_node_id, reference_name, reference_kind, line, col, file_path, language, status, name_tail)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`),

    findByName: db.prepare(`SELECT id, name, kind, qualified_name, file_path FROM nodes WHERE name = ? LIMIT 1`),

    findByNameAndKind: db.prepare(`SELECT id, name, kind, qualified_name, file_path FROM nodes WHERE name = ? AND kind = ? LIMIT 1`),

    updateEdgeTarget: db.prepare(`UPDATE edges SET target = ? WHERE target = ?`),

    deleteResolvedRefs: db.prepare(`DELETE FROM unresolved_refs WHERE from_node_id = ? AND reference_name = ?`),

    stats: db.prepare(`SELECT kind, COUNT(*) as count FROM nodes GROUP BY kind`),

    nodeCount: db.prepare(`SELECT COUNT(*) as count FROM nodes`),
    edgeCount: db.prepare(`SELECT COUNT(*) as count FROM edges`),
  };

  db[STMTS] = s;
  return s;
}

// ── write operations ──────────────────────────────────────────────────

function storeNodes(db, nodes, chunkSize = 500) {
  const s = prepare(db);
  for (let i = 0; i < nodes.length; i += chunkSize) {
    const chunk = nodes.slice(i, i + chunkSize);
    for (const n of chunk) {
      s.insertNode.run(
        n.id,
        n.kind,
        n.name,
        n.qualifiedName,
        n.filePath,
        n.language,
        n.startLine,
        n.endLine,
        n.startColumn,
        n.endColumn,
        n.docstring || null,
        n.signature || null,
        n.visibility || null,
        n.isExported ? 1 : 0,
        n.isAsync ? 1 : 0,
        n.isStatic ? 1 : 0,
        n.isAbstract ? 1 : 0,
        n.metadata ? JSON.stringify(n.metadata) : null,
        n.decorators ? JSON.stringify(n.decorators) : null,
        n.typeParameters ? JSON.stringify(n.typeParameters) : null,
        n.returnType || null,
        n.updatedAt
      );
    }
  }
}

function storeEdges(db, edges, chunkSize = 500) {
  const s = prepare(db);
  for (let i = 0; i < edges.length; i += chunkSize) {
    const chunk = edges.slice(i, i + chunkSize);
    for (const e of chunk) {
      // Skip edges with missing source/target
      if (!e.source || !e.target || !e.kind) continue;
      s.insertEdge.run(
        e.source,
        e.target,
        e.kind,
        e.metadata != null ? JSON.stringify(e.metadata) : null,
        e.line != null ? e.line : null,
        e.column != null ? e.column : null,
        e.provenance != null ? e.provenance : null
      );
    }
  }
}

function storeFile(db, relPath, absPath, source, nodeCount) {
  const s = prepare(db);
  const crypto = require("crypto");
  const hash = crypto.createHash("sha256").update(source).digest("hex");
  let modTime = Date.now();
  try { modTime = fs.statSync(absPath).mtimeMs; } catch (_) {}
  s.upsertFile.run(
    relPath,
    hash,
    "javascript",
    Buffer.byteLength(source, "utf8"),
    modTime,
    Date.now(),
    nodeCount
  );
}

function storeSegments(db, nameSegments) {
  const s = prepare(db);
  for (const [seg, name] of nameSegments) {
    s.insertSegment.run(seg, name);
  }
}

function storeUnresolvedRefs(db, refs) {
  const s = prepare(db);
  for (const r of refs) {
    s.insertUnresolved.run(
      r.fromNodeId,
      r.referenceName,
      r.referenceKind,
      r.line,
      r.column,
      r.filePath || "",
      r.language || "javascript",
      "pending",
      r.name_tail || r.referenceName.split(".").pop()
    );
  }
}

// ── resolution ────────────────────────────────────────────────────────

function resolveReferences(db, allNodesByName) {
  const s = prepare(db);

  // Collect all edge targets that are names (not IDs) from edges
  const targetsToResolve = db
    .prepare(`SELECT DISTINCT target FROM edges WHERE target NOT LIKE '%:%'`)
    .all();

  for (const row of targetsToResolve) {
    const name = row.target;
    const matches = allNodesByName.get(name);
    if (matches && matches.length === 1) {
      const nodeId = matches[0];
      s.updateEdgeTarget.run(nodeId, name);
    }
    // If multiple matches or no matches, keep as-is (unresolved)
  }

  // Clean up resolved refs
  const pendingRefs = db.prepare(`SELECT * FROM unresolved_refs WHERE status = 'pending'`).all();
  for (const ref of pendingRefs) {
    const matches = allNodesByName.get(ref.reference_name);
    if (matches && matches.length === 1) {
      s.deleteResolvedRefs.run(ref.from_node_id, ref.reference_name);
    } else if (matches && matches.length > 1) {
      // Multiple possible targets — mark failed
      db.prepare(
        `UPDATE unresolved_refs SET status = 'failed', name_tail = ? WHERE id = ?`
      ).run(ref.reference_name.split(".").pop(), ref.id);
    } else {
      // No match — mark failed
      db.prepare(
        `UPDATE unresolved_refs SET status = 'failed', name_tail = ? WHERE id = ?`
      ).run(ref.reference_name.split(".").pop(), ref.id);
    }
  }
}

// ── stats ──────────────────────────────────────────────────────────────

function getStats(db) {
  const nodeCount = prepare(db).nodeCount.all()[0]?.count || 0;
  const edgeCount = prepare(db).edgeCount.all()[0]?.count || 0;
  const fileCount = db.prepare("SELECT COUNT(*) as count FROM files").all()[0]?.count || 0;
  return { nodes: nodeCount, edges: edgeCount, files: fileCount };
}

module.exports = {
  openDatabase,
  storeNodes,
  storeEdges,
  storeFile,
  storeSegments,
  storeUnresolvedRefs,
  resolveReferences,
  getStats,
};
