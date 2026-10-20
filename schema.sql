-- Schema tham chiếu; server.mjs tự tạo khi khởi động.
PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;
CREATE TABLE users(id INTEGER PRIMARY KEY,name TEXT NOT NULL,username TEXT UNIQUE NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL,active INTEGER DEFAULT 1);
CREATE TABLE sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE records(id INTEGER PRIMARY KEY,kind TEXT NOT NULL,data TEXT NOT NULL,version INTEGER NOT NULL DEFAULT 1,updated TEXT NOT NULL);
CREATE TABLE files(id TEXT PRIMARY KEY,record_id INTEGER,user_id INTEGER,name TEXT,mime TEXT,size INTEGER);
CREATE TABLE audit(id INTEGER PRIMARY KEY,at TEXT,user_id INTEGER,action TEXT,record_id INTEGER,detail TEXT);
CREATE TABLE settings(id INTEGER PRIMARY KEY CHECK(id=1),threshold INTEGER DEFAULT 7);
-- records.kind: project | proposal
-- data: name,code,type,address,coordinates,region,owner,assignees[],contractor,
-- responsible,supervisor,budget,cost,status,plannedStart,start,initialDeadline,
-- deadline,completed,accepted,handoverPlan,handoverActual,handoverStatus,
-- items[{name,unit,approved,done,weight}],issues[],pauses[],history[],source,projectId.
-- Proposal: priority,damage,condition,suspectedCause,verifiedCause,plan,
-- assessment,desiredDate,created. Mỗi lần cập nhật dùng WHERE id=? AND version=?.
