import type { DocumentCategory, WikiDocument } from "@/types/document";
import type { OfficialDoc } from "@/types/official-doc";
import type { Tag, TagType } from "@/types/tag";

const now = new Date().toISOString();

type DbmsDetail = {
  behavior: string;
  settings: string[];
  diagnosis: string[];
  risks: string[];
};

type GeneralSpec = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: DocumentCategory;
  tags: string[];
  scope: string;
  concept: string;
  internal: string;
  comparisonRows: Array<[string, string, string, string]>;
  mysql: DbmsDetail;
  postgresql: DbmsDetail;
  oracle: DbmsDetail;
  judgment: string[];
  issues: string[];
  checklist: string[];
  sql: string[];
  references: string[];
  deepDive?: TopicDeepDive;
};

type TopicDeepDive = {
  operatingModel: string;
  dbmsNotes: string[];
  dangerousConditions: string[];
  diagnostics: string[];
  operatingRules: string[];
};

const tagTypes: Record<string, TagType> = {
  MySQL: "DBMS",
  PostgreSQL: "DBMS",
  Oracle: "DBMS",
  Architecture: "INTERNAL",
  Index: "TOPIC",
  MVCC: "TOPIC",
  Lock: "TOPIC",
  Optimizer: "TOPIC",
  Partitioning: "ADVANCED",
  Replication: "ADVANCED",
  "Materialized View": "ADVANCED",
  JSON: "ADVANCED",
  "Full Text Search": "ADVANCED",
  Monitoring: "OPERATION",
  Backup: "OPERATION",
  Recovery: "OPERATION",
  Deadlock: "OPERATION",
  "Slow Query": "OPERATION",
  Migration: "CASE",
  Upload: "CASE"
};

export const referenceTags: Tag[] = Object.entries(tagTypes).map(([name, type]) => ({
  id: `tag-${slugId(name)}`,
  name,
  type,
  created_at: now
}));

function slugId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function tagsFor(names: string[]) {
  return referenceTags.filter((tag) => names.includes(tag.name));
}

function officialDocs(documentId: string, refs: string[]): OfficialDoc[] {
  return refs.map((ref, index) => {
    const [dbms, title, url] = ref.split("|");
    return {
      id: `official-${documentId}-${index + 1}`,
      document_id: documentId,
      dbms,
      title,
      url,
      note: "공식문서에서 동작 기준과 설정 의미를 확인합니다.",
      version: "current",
      created_at: now
    };
  });
}

function list(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function comparison(rows: GeneralSpec["comparisonRows"]) {
  return [
    "| 관점 | MySQL | PostgreSQL | Oracle |",
    "|---|---|---|---|",
    ...rows.map(([view, mysql, postgresql, oracle]) => `| ${view} | ${mysql} | ${postgresql} | ${oracle} |`)
  ].join("\n");
}

function dialectSqlBlock(statement: string | undefined, dialect: "mysql" | "postgresql" | "oracle") {
  if (!statement) return "";
  return `\`\`\`${dialect}\n${statement.trim()}\n\`\`\``;
}

function comparisonSqlBlock(statements: string[]) {
  return [
    dialectSqlBlock(statements[0], "mysql"),
    dialectSqlBlock(statements[1], "postgresql"),
    dialectSqlBlock(statements[2], "oracle")
  ].filter(Boolean).join("\n\n");
}

function renderTopicDeepDive(spec: GeneralSpec) {
  const deepDive = spec.deepDive;
  if (!deepDive) {
    return "";
  }

  return `
## 운영 모델 상세

${deepDive.operatingModel}

### DBMS별 세부 확인 포인트

${list(deepDive.dbmsNotes)}

### 사용하면 위험한 조건

${list(deepDive.dangerousConditions)}

### 추가 진단 절차

${list(deepDive.diagnostics)}

### 운영 규칙

${list(deepDive.operatingRules)}
`;
}

function renderGeneral(spec: GeneralSpec) {
  return `# ${spec.title}

## 한 줄 결론

${spec.description} 운영 판단은 기능 지원 여부가 아니라 내부 저장 구조, 통계 품질, lock 범위, 복구 비용, replication 영향까지 함께 확인해야 합니다.

## Tags

${spec.tags.map((tag) => `\`${tag}\``).join(" ")}

## 적용 범위

${spec.scope}

## 핵심 개념

${spec.concept}

## 내부 동작

${spec.internal}

## 운영 관점

${spec.title}를 운영 문서로 볼 때는 기능 자체보다 workload 조건과 장애 전파 경로를 먼저 확인해야 합니다. 같은 기능이라도 OLTP, batch, analytics, CDC, read replica, backup window에서는 병목 지점이 다르게 나타납니다.

- 요청량이 증가할 때 CPU, memory, I/O, lock 중 어떤 자원이 먼저 포화되는지 확인합니다.
- 장애가 발생했을 때 application timeout, connection pool, replication lag, backup 지연 중 어디로 전파되는지 확인합니다.
- 설정 변경이 즉시 반영되는지, restart가 필요한지, session 단위인지 instance 단위인지 구분합니다.
- managed service에서는 superuser 권한, extension 설치, system view 접근, parameter group 반영 시점이 제한될 수 있습니다.
- 동일한 SQL이라도 데이터 분포, 통계 갱신 시점, cache 상태, concurrent transaction 수에 따라 전혀 다른 결과를 보일 수 있습니다.

## 사전 확인 항목

- 현재 workload가 read-heavy, write-heavy, mixed, batch-heavy 중 어디에 가까운지 분류합니다.
- peak 시간대의 TPS/QPS, p95/p99 latency, active session 수, lock wait 시간을 확인합니다.
- 최근 DDL, index 생성, 통계 갱신, parameter 변경, 배포 이력을 확인합니다.
- primary와 replica의 지표를 분리해서 보고, lag와 stale read 허용 범위를 확인합니다.
- backup, vacuum/purge, checkpoint, archiving 같은 background 작업 시간이 업무 traffic과 겹치는지 확인합니다.
- 장애 대응 시 사용할 read-only 계정, system view 권한, bastion 접근 경로가 준비되어 있는지 확인합니다.
- 변경 전 baseline query와 변경 후 비교할 dashboard 또는 SQL을 정해 둡니다.

${renderTopicDeepDive(spec)}

## DBMS별 구현 차이

${comparison(spec.comparisonRows)}

| 관점 | MySQL | PostgreSQL | Oracle |
|---|---|---|---|
| 대표 실행 계획 확인 | EXPLAIN, EXPLAIN ANALYZE, optimizer trace | EXPLAIN (ANALYZE, BUFFERS), auto_explain | DBMS_XPLAN, SQL Monitor, AWR |
| 주요 wait/병목 관점 | InnoDB row lock, metadata lock, redo flush, buffer pool miss | lock wait, LWLock, I/O wait, autovacuum, WAL flush | enqueue, latch, buffer busy waits, log file sync |
| 변경 전 검증 | staging workload, invisible index, optimizer switch 영향 | statistics target, enable_* GUC, plan 비교 | SQL Plan Baseline, invisible index, optimizer parameter |
| 장애 전파 경로 | connection pile-up, replication lag, purge lag | connection pile-up, WAL retention, bloat 증가 | session pile-up, archived log pressure, undo pressure |

## MySQL

### 동작 방식

${spec.mysql.behavior}

### 관련 설정

${list(spec.mysql.settings)}

### 진단 방법

${list(spec.mysql.diagnosis)}

### 운영 주의점

${list(spec.mysql.risks)}

### 실행 계획 해석

- EXPLAIN ANALYZE에서 actual time, rows, loops를 보고 추정치와 실제 처리량 차이를 확인합니다.
- type이 ALL이어도 작은 table이면 정상일 수 있으므로 rows examined와 latency를 함께 봅니다.
- Using temporary, Using filesort는 항상 장애가 아니지만 결과 set 크기와 sort buffer 사용량이 커질 때 위험합니다.
- key가 선택되었더라도 rows가 크면 index 선택도가 낮거나 composite index 순서가 맞지 않을 수 있습니다.
- plan 변경 전후에는 performance_schema.events_statements_summary_by_digest의 digest 기준으로 누적 비용을 비교합니다.

### 장애 분석 절차

- application timeout 시점과 MySQL slow query log의 timestamp를 맞춥니다.
- SHOW PROCESSLIST 또는 Performance Schema에서 runnable query와 lock wait query를 분리합니다.
- SHOW ENGINE INNODB STATUS에서 latest detected deadlock, history list length, lock wait를 확인합니다.
- replication 구성에서는 source의 commit latency와 replica의 apply lag를 분리합니다.
- DDL 직후라면 metadata lock 대기와 table rebuild 여부를 확인합니다.

### 예시 SQL

${dialectSqlBlock(spec.sql[0], "mysql")}

## PostgreSQL

### 동작 방식

${spec.postgresql.behavior}

### 관련 설정

${list(spec.postgresql.settings)}

### 진단 방법

${list(spec.postgresql.diagnosis)}

### 운영 주의점

${list(spec.postgresql.risks)}

### 실행 계획 해석

- EXPLAIN (ANALYZE, BUFFERS)에서 estimated rows와 actual rows 차이를 먼저 확인합니다.
- shared hit, shared read, temp read/write를 구분해서 cache 문제인지 disk spill 문제인지 판단합니다.
- nested loop가 항상 나쁜 것은 아니지만 outer rows가 크게 빗나가면 급격히 느려질 수 있습니다.
- sequential scan은 작은 table 또는 높은 선택도에서는 정상일 수 있으므로 buffer와 row count를 함께 봅니다.
- pg_stat_statements의 mean, min, max, stddev를 같이 보아 특정 parameter에서만 느린지 확인합니다.

### 장애 분석 절차

- pg_stat_activity에서 wait_event_type과 wait_event를 확인합니다.
- blocking query는 pg_blocking_pids(pid)로 추적하고 transaction 시작 시각을 함께 봅니다.
- pg_stat_user_tables에서 dead tuple, vacuum 시각, analyze 시각을 확인합니다.
- WAL 증가가 빠르면 replication slot, archiving, long transaction을 함께 확인합니다.
- temporary file 증가가 있으면 work_mem 부족 또는 hash/sort spill을 의심합니다.

### 예시 SQL

${dialectSqlBlock(spec.sql[1], "postgresql")}

## Oracle

### 동작 방식

${spec.oracle.behavior}

### 관련 설정

${list(spec.oracle.settings)}

### 진단 방법

${list(spec.oracle.diagnosis)}

### 운영 주의점

${list(spec.oracle.risks)}

### 실행 계획 해석

- DBMS_XPLAN.DISPLAY_CURSOR에서 estimated rows, actual rows, predicate information을 함께 봅니다.
- TABLE ACCESS BY INDEX ROWID가 많으면 clustering factor와 buffer gets를 확인합니다.
- HASH JOIN, NESTED LOOPS, MERGE JOIN 선택은 row 추정과 PGA 사용량에 영향을 받습니다.
- bind peeking, adaptive cursor sharing, histogram 때문에 같은 SQL도 child cursor별 plan이 달라질 수 있습니다.
- AWR에서 top SQL과 wait class를 함께 보아 CPU 병목인지 I/O 병목인지 구분합니다.

### 장애 분석 절차

- V$SESSION에서 wait class, event, blocking_session을 확인합니다.
- V$SQL에서 elapsed_time, buffer_gets, disk_reads, executions를 비교합니다.
- undo 관련 오류가 있으면 V$UNDOSTAT와 long query 시간을 함께 봅니다.
- archived redo log 공간이 부족하면 FRA 사용량과 archive destination 상태를 먼저 확인합니다.
- plan regression 의심 시 SQL_ID 기준으로 과거 plan hash value와 현재 plan을 비교합니다.

### 예시 SQL

${dialectSqlBlock(spec.sql[2], "oracle")}

## 실무 판단 기준

${list(spec.judgment)}

- 변경이 read path만 바꾸는지, write path와 recovery path까지 바꾸는지 구분합니다.
- query 단위 최적화인지 schema/index 설계 변경인지 분리합니다.
- 단기 완화 조치와 영구 수정 조치를 분리해서 기록합니다.
- 성능 개선 효과를 평균 latency가 아니라 p95/p99와 resource saturation 기준으로 확인합니다.
- 장애 가능성이 있는 변경은 rollback SQL, feature flag, traffic drain 절차를 준비합니다.
- DBMS별 parameter는 이름이 비슷해도 의미와 적용 단위가 다를 수 있으므로 공식문서 기준으로 확인합니다.
- workload 재현이 어렵다면 production read-only 관측 지표를 먼저 늘리고 변경 범위를 줄입니다.
- 데이터 증가율과 보존 정책을 함께 보아 3개월 이후에도 같은 판단이 유효한지 확인합니다.
- replica, backup, CDC, monitoring pipeline이 변경 후에도 정상 동작하는지 확인합니다.
- 변경 후 1회성 확인이 아니라 다음 peak window까지 관측합니다.

## 장애/성능 이슈 패턴

${list(spec.issues)}

- connection pool이 포화되어 DB 병목이 application queueing으로 보입니다.
- lock wait가 증가하면서 CPU 사용률은 낮지만 응답 시간은 길어집니다.
- 통계 갱신 직후 실행 계획이 바뀌고 특정 query만 급격히 느려집니다.
- background maintenance 작업과 batch 작업이 겹쳐 I/O wait가 증가합니다.
- replica lag가 누적되어 읽기 결과가 업무 요구와 맞지 않습니다.
- archive/WAL/binlog 보존량이 증가해 disk pressure가 발생합니다.
- timeout 재시도가 같은 SQL을 중복 실행해 DB 부하를 더 키웁니다.
- 장애 완화용 index 추가가 write latency와 replication lag를 증가시킵니다.

## 진단 체크리스트

${list(spec.checklist)}

- 문제가 전체 query인지 특정 endpoint/query digest인지 분리합니다.
- p95/p99 latency가 증가한 시점과 배포/DDL/통계 갱신 시점을 맞춥니다.
- active session 중 CPU 실행, lock wait, I/O wait, idle in transaction을 분류합니다.
- 실행 계획에서 row estimation 오차가 큰 node를 찾습니다.
- temporary file, sort/hash spill, undo/WAL/redo 증가량을 확인합니다.
- primary와 replica의 지표가 같은 방향으로 움직이는지 비교합니다.
- 장애 시간대의 top SQL과 평상시 top SQL을 비교합니다.
- connection pool timeout, DB timeout, statement timeout 값을 구분합니다.
- 완화 조치 후 같은 증상이 재발하는지 다음 peak까지 관측합니다.
- 분석 결과를 SQL, plan, 지표, timeline 기준으로 기록합니다.

## 튜닝 판단 기준

- index 추가 전에는 기존 index와 중복 여부, DML 증가 비용, storage 증가량을 계산합니다.
- parameter 변경 전에는 적용 범위, restart 필요 여부, rollback 가능성을 확인합니다.
- query rewrite 전에는 결과 동일성, null 처리, collation, implicit cast 변화를 검증합니다.
- batch 크기 조정은 lock 보유 시간, log flush 빈도, replication lag를 함께 봅니다.
- partition 전략은 pruning 성공률, maintenance lock, global/local index 영향을 함께 확인합니다.
- connection 증설은 DB 처리량을 늘리는 조치가 아니라 queue 위치를 바꾸는 조치일 수 있습니다.
- cache hit 개선은 memory 증설보다 working set, access pattern, full scan 원인 분석이 먼저입니다.

## 변경/롤백 절차

- 변경 목적과 기대 지표를 하나의 문장으로 정의합니다.
- 변경 전 baseline SQL과 dashboard snapshot을 남깁니다.
- 변경은 가능한 한 단일 변수로 나누고, 동시에 여러 parameter를 바꾸지 않습니다.
- 적용 직후 error rate, DB connection, wait event, replication lag, disk 사용량을 확인합니다.
- 기대 효과가 없거나 부작용이 나타나면 사전에 준비한 rollback 절차를 실행합니다.
- rollback 이후에도 plan cache, prepared statement, connection pool 상태가 이전과 같은지 확인합니다.
- 사후 문서에는 원인, 변경, 효과, 부작용, 재발 방지 항목을 남깁니다.

## 확인 결과 기록 양식

| 항목 | 기록 |
|---|---|
| 증상 시작 시각 | YYYY-MM-DD HH:mm:ss |
| 영향 범위 | endpoint, batch job, DB user, schema |
| top SQL / SQL ID | query digest, queryid, sql_id |
| 주요 wait | lock, I/O, log flush, CPU |
| 실행 계획 변화 | plan hash, join order, access path |
| 임시 완화 | kill session, index invisible, traffic shift |
| 영구 조치 | schema change, query rewrite, parameter review |

## 공식문서 참고

${list(spec.references.map((ref) => {
  const [dbms, title, url] = ref.split("|");
  return `${dbms}: [${title}](${url})`;
}))}
`;
}

function renderArchitecture(dbms: "MySQL" | "PostgreSQL" | "Oracle") {
  const matrix = {
    MySQL: {
      slug: "dbms/mysql/architecture",
      id: "doc-mysql-architecture",
      description: "MySQL Architecture는 SQL 계층과 InnoDB 중심의 storage engine 계층을 분리해서 보아야 합니다.",
      tags: ["MySQL", "Architecture", "MVCC", "Lock", "Optimizer", "Monitoring"],
      process: "MySQL은 connection thread, background thread, InnoDB purge thread, page cleaner, log writer가 함께 동작합니다. thread cache와 connection 수가 맞지 않으면 context switching과 memory 사용량이 증가합니다.",
      memory: "주요 메모리 영역은 InnoDB buffer pool, log buffer, change buffer, adaptive hash index, sort/join/read buffer입니다. 전역 메모리와 session 메모리를 분리해서 산정해야 합니다.",
      storage: "InnoDB는 clustered primary key 기반으로 row를 저장하고 secondary index leaf에는 primary key 값이 들어갑니다. primary key 설계가 secondary lookup 비용과 page split에 영향을 줍니다.",
      transaction: "MVCC는 Undo Log와 Read View를 사용합니다. 긴 transaction은 purge 지연, undo tablespace 증가, history list length 증가로 이어집니다.",
      lock: "record lock, gap lock, next-key lock, metadata lock을 구분해야 합니다. isolation level과 access path가 lock 범위를 바꿉니다.",
      optimizer: "optimizer는 persistent statistics, histogram, index cardinality를 사용합니다. EXPLAIN ANALYZE와 optimizer trace로 추정 row와 실제 row 차이를 확인합니다.",
      replication: "binary log 기반 replication, GTID, semi-sync, Group Replication을 구성할 수 있습니다. replication lag와 write consistency 요구사항을 분리해야 합니다.",
      backup: "logical dump, clone plugin, physical backup, binary log point-in-time recovery를 목적별로 선택합니다. backup 중 I/O와 redo 생성량을 관찰해야 합니다.",
      monitoring: "Performance Schema, sys schema, slow query log, SHOW ENGINE INNODB STATUS, replication status를 함께 확인합니다.",
      params: ["innodb_buffer_pool_size", "innodb_log_file_size", "innodb_flush_log_at_trx_commit", "transaction_isolation", "max_connections", "binlog_format", "sync_binlog"],
      sql: [
        "select * from performance_schema.events_statements_summary_by_digest order by sum_timer_wait desc limit 10;",
        "show engine innodb status;",
        "select * from sys.schema_table_statistics order by total_latency desc limit 10;"
      ],
      risks: ["buffer pool 부족으로 random I/O가 증가합니다.", "긴 transaction은 purge 지연과 undo 증가를 만듭니다.", "metadata lock은 DDL과 장기 query를 함께 지연시킵니다.", "복제 지연 상태에서 read replica로 읽으면 stale read가 발생합니다.", "primary key 설계가 secondary index 비용을 크게 바꿉니다."],
      refs: [
        "MySQL|MySQL Reference Manual: InnoDB Architecture|https://dev.mysql.com/doc/refman/8.0/en/innodb-architecture.html",
        "MySQL|MySQL Reference Manual: Performance Schema|https://dev.mysql.com/doc/refman/8.0/en/performance-schema.html",
        "MySQL|MySQL Reference Manual: Replication|https://dev.mysql.com/doc/refman/8.0/en/replication.html"
      ]
    },
    PostgreSQL: {
      slug: "dbms/postgresql/architecture",
      id: "doc-postgresql-architecture",
      description: "PostgreSQL Architecture는 process-per-connection, shared buffers, WAL, MVCC tuple version, autovacuum을 함께 보아야 합니다.",
      tags: ["PostgreSQL", "Architecture", "MVCC", "Optimizer", "Monitoring"],
      process: "PostgreSQL은 backend process, postmaster, checkpointer, background writer, WAL writer, autovacuum worker로 구성됩니다. connection이 많으면 process memory와 scheduler 비용이 증가합니다.",
      memory: "shared_buffers, work_mem, maintenance_work_mem, effective_cache_size를 구분해야 합니다. work_mem은 연산 노드별로 사용할 수 있어 동시성이 높으면 급격히 증가합니다.",
      storage: "heap table은 tuple version을 page에 저장하고 index는 TID를 가리킵니다. dead tuple과 bloat는 vacuum과 autovacuum 설정에 직접 영향을 받습니다.",
      transaction: "MVCC는 xmin/xmax와 snapshot visibility를 사용합니다. 긴 transaction은 vacuum cleanup을 막고 transaction id wraparound 위험을 높입니다.",
      lock: "row lock, table lock, predicate lock, advisory lock을 구분합니다. pg_locks와 pg_stat_activity를 함께 보아 blocking chain을 확인합니다.",
      optimizer: "planner는 pg_statistic, extended statistics, cost parameter를 사용합니다. EXPLAIN (ANALYZE, BUFFERS)로 실제 row와 buffer 사용량을 확인합니다.",
      replication: "streaming replication, replication slot, logical replication을 지원합니다. inactive slot은 WAL 보존량을 증가시킵니다.",
      backup: "pg_basebackup, WAL archiving, PITR, logical dump를 목적별로 선택합니다. recovery target과 archive_command 검증이 필요합니다.",
      monitoring: "pg_stat_activity, pg_stat_statements, pg_locks, pg_stat_database, pg_stat_replication, auto_explain을 확인합니다.",
      params: ["shared_buffers", "work_mem", "maintenance_work_mem", "autovacuum_vacuum_scale_factor", "max_connections", "wal_level", "max_wal_size"],
      sql: [
        "select pid, state, wait_event_type, wait_event, query from pg_stat_activity where state <> 'idle';",
        "select relation::regclass, mode, granted from pg_locks where not granted;",
        "select query, calls, mean_exec_time, rows from pg_stat_statements order by total_exec_time desc limit 10;"
      ],
      risks: ["autovacuum 지연은 bloat와 wraparound 위험으로 이어집니다.", "work_mem 과대 설정은 동시 query에서 memory pressure를 만듭니다.", "replication slot 방치는 WAL 증가를 유발합니다.", "통계가 stale하면 join order가 급격히 악화됩니다.", "장기 transaction은 vacuum cleanup을 차단합니다."],
      refs: [
        "PostgreSQL|PostgreSQL Documentation: Server Architecture|https://www.postgresql.org/docs/current/tutorial-arch.html",
        "PostgreSQL|PostgreSQL Documentation: MVCC|https://www.postgresql.org/docs/current/mvcc.html",
        "PostgreSQL|PostgreSQL Documentation: Monitoring|https://www.postgresql.org/docs/current/monitoring.html"
      ]
    },
    Oracle: {
      slug: "dbms/oracle/architecture",
      id: "doc-oracle-architecture",
      description: "Oracle Architecture는 SGA/PGA, process model, undo/redo, datafile/control file, wait event를 기준으로 해석해야 합니다.",
      tags: ["Oracle", "Architecture", "MVCC", "Lock", "Monitoring", "Backup"],
      process: "Oracle은 server process, background process, DBWn, LGWR, CKPT, SMON, PMON, ARCn이 함께 동작합니다. dedicated/shared server 구성에 따라 session resource 사용 방식이 달라집니다.",
      memory: "SGA에는 database buffer cache, shared pool, redo log buffer가 포함되고 PGA는 sort/hash/session 작업에 사용됩니다. AMM/ASMM 사용 여부와 workload 특성을 함께 봅니다.",
      storage: "tablespace, datafile, segment, extent, block 구조로 저장합니다. index는 ROWID를 통해 table block으로 접근합니다.",
      transaction: "consistent read는 Undo Segment를 사용합니다. undo retention이 부족하거나 undo pressure가 높으면 ORA-01555가 발생할 수 있습니다.",
      lock: "row lock, enqueue, latch, library cache lock을 구분합니다. blocking session과 wait event를 함께 확인해야 합니다.",
      optimizer: "CBO는 object statistics, histogram, system statistics를 사용합니다. DBMS_XPLAN으로 estimated/actual row와 predicate를 확인합니다.",
      replication: "Data Guard, GoldenGate, materialized view replication 등 목적별 선택지가 있습니다. redo transport lag와 apply lag를 분리해서 봅니다.",
      backup: "RMAN backup, archived redo log, control file backup, flashback 기능을 복구 목표에 맞춰 설계합니다.",
      monitoring: "AWR, ASH, V$SESSION, V$SQL, V$LOCK, DBMS_XPLAN을 사용합니다. wait class와 top SQL을 함께 해석합니다.",
      params: ["sga_target", "pga_aggregate_target", "undo_retention", "optimizer_features_enable", "processes", "open_cursors", "db_recovery_file_dest_size"],
      sql: [
        "select sid, serial#, wait_class, event, blocking_session from v$session where status = 'ACTIVE';",
        "select sql_id, executions, elapsed_time, buffer_gets from v$sql order by elapsed_time desc fetch first 10 rows only;",
        "select * from table(dbms_xplan.display_cursor(null, null, 'ALLSTATS LAST'));"
      ],
      risks: ["undo 부족은 consistent read 실패와 rollback 지연을 만듭니다.", "shared pool pressure는 hard parse 증가로 이어집니다.", "blocking session 방치는 전체 업무 지연을 유발합니다.", "archived redo log 공간 부족은 database hang으로 이어질 수 있습니다.", "통계 관리 실패는 CBO plan regression을 만듭니다."],
      refs: [
        "Oracle|Oracle Database Concepts|https://docs.oracle.com/en/database/oracle/oracle-database/",
        "Oracle|Oracle Database Performance Tuning Guide|https://docs.oracle.com/en/database/oracle/oracle-database/",
        "Oracle|Oracle Backup and Recovery User's Guide|https://docs.oracle.com/en/database/oracle/oracle-database/"
      ]
    }
  }[dbms];

  const content = `# ${dbms} Architecture

## 한 줄 결론

${matrix.description} 운영 안정성은 query 성능만이 아니라 transaction, memory, lock, redo/WAL, backup/recovery 경로가 함께 맞물릴 때 확보됩니다.

## Tags

${matrix.tags.map((tag) => `\`${tag}\``).join(" ")}

## 적용 범위

이 문서는 ${dbms}의 핵심 architecture 구성 요소와 운영 진단 관점을 다룹니다. 세부 버전별 차이는 공식문서의 release note와 parameter reference를 함께 확인해야 합니다.

## 전체 구조

${matrix.description} 장애 분석에서는 user session, execution engine, buffer/cache, log, storage, replication 경로를 순서대로 분리합니다.

운영 관점에서는 architecture를 구성 요소 목록으로 보지 않고 요청이 통과하는 경로로 해석해야 합니다. client connection이 생성되고 SQL이 parse/plan/execute 단계를 거쳐 buffer/cache, transaction log, storage, replication, backup 경로에 영향을 남깁니다. 한 구간에서 발생한 지연은 connection pool, application timeout, retry, replica lag, archive/log retention으로 전파될 수 있습니다.

### 요청 처리 경로

- client가 connection을 확보하고 session state를 초기화합니다.
- SQL parse와 권한 검사가 수행됩니다.
- optimizer가 통계와 parameter를 사용해 실행 계획을 선택합니다.
- executor가 buffer/cache, index, table, temporary area를 사용합니다.
- 변경 작업은 undo/redo/WAL/binlog/archive 경로에 기록됩니다.
- commit은 durability 설정에 따라 log flush와 replication 대기 시간을 포함할 수 있습니다.
- background worker가 checkpoint, vacuum/purge, archiving, replication apply를 수행합니다.

### 운영자가 분리해야 하는 질문

- 느린 것이 connection 획득인지, SQL 실행인지, commit인지, fetch인지 구분합니다.
- CPU가 높은지, CPU는 낮지만 wait가 긴지 구분합니다.
- read query 문제인지 write transaction 문제인지 구분합니다.
- primary 문제인지 replica 문제인지 구분합니다.
- foreground query 문제인지 background maintenance 문제인지 구분합니다.
- parameter 한계인지 schema/index 설계 문제인지 구분합니다.
- 일시적 skew인지 데이터 증가로 인한 구조적 한계인지 구분합니다.

## Process / Thread 구조

${matrix.process}

### 확인 포인트

- session 수가 증가할 때 process/thread memory가 선형으로 증가하는지 확인합니다.
- idle connection이 많은지, active query가 많은지, lock wait session이 많은지 분리합니다.
- background worker가 필요한 작업을 따라가지 못하면 foreground query가 직접 느려지지 않아도 log, vacuum, purge, checkpoint backlog가 누적됩니다.
- scheduler run queue가 길어지면 DB 내부 wait가 아니라 OS CPU scheduling 지연이 병목일 수 있습니다.
- connection pool의 max size는 DB의 max connection보다 작아야 하며, application instance 수를 곱해서 계산해야 합니다.

## Memory 구조

${matrix.memory}

### 메모리 산정 기준

- 공유 cache 영역과 session별 작업 메모리를 분리해서 계산합니다.
- sort/hash/join/temp 작업은 query 하나가 여러 번 사용할 수 있으므로 단순히 connection 수와 곱하면 과소/과대 추정될 수 있습니다.
- OS page cache를 사용하는 DBMS와 자체 buffer cache 의존도가 높은 DBMS를 구분합니다.
- memory pressure가 swap으로 이어지면 DB 지연은 급격히 커지므로 swap 사용량을 별도 경보로 둡니다.
- cache hit ratio만으로 충분하지 않으며 working set 크기, full scan 빈도, checkpoint I/O를 함께 확인합니다.

## Storage 구조

${matrix.storage}

### 저장소 운영 기준

- data file, transaction log, archive/WAL/binlog, temporary file, backup 영역을 분리해서 용량을 산정합니다.
- random read, sequential scan, log flush, checkpoint write는 서로 다른 I/O 패턴입니다.
- index가 늘면 read path만 좋아지는 것이 아니라 write path, backup size, restore time이 함께 증가합니다.
- bloat, fragmentation, page split, dead tuple은 모두 storage 증가로 보이지만 원인과 조치가 다릅니다.
- cloud volume에서는 IOPS, throughput, burst credit, latency percentile을 함께 확인합니다.

## Transaction / MVCC 구조

${matrix.transaction}

### 운영 영향

- long transaction은 과거 version 정리를 막고 undo/WAL/redo retention을 증가시킵니다.
- isolation level은 read consistency뿐 아니라 lock 범위, phantom 처리, retry 필요성에 영향을 줍니다.
- batch transaction이 너무 크면 rollback 시간과 replication apply 시간이 길어집니다.
- autocommit 여부는 lock 보유 시간과 log flush 빈도를 바꿉니다.
- backup snapshot과 long-running report query는 MVCC 정리 지연의 원인이 될 수 있습니다.

## Lock 구조

${matrix.lock}

### lock 분석 기준

- blocker와 waiter를 분리하고 blocker가 실제로 CPU를 쓰는지 idle in transaction인지 확인합니다.
- row lock과 metadata/schema lock은 증상이 비슷해도 대응 절차가 다릅니다.
- deadlock은 victim query만 보지 말고 transaction 내부의 lock 획득 순서를 재구성해야 합니다.
- lock timeout은 완화책일 수 있지만 application retry가 중복 부하를 만들 수 있습니다.
- DDL은 짧아 보여도 metadata lock 또는 table rewrite 때문에 운영 영향이 커질 수 있습니다.

## Optimizer / Execution 구조

${matrix.optimizer}

### 실행 계획 운영 기준

- estimated rows와 actual rows 차이가 큰 node가 plan regression의 출발점입니다.
- 통계 수집은 성능 개선 작업이지만 동시에 plan 변경을 유발하는 운영 이벤트입니다.
- index scan, full scan, hash join, nested loop는 각각 정상일 수 있으므로 row count와 buffer 사용량으로 판단합니다.
- bind variable, prepared statement, histogram, adaptive plan은 같은 SQL의 plan을 여러 개로 만들 수 있습니다.
- 실행 계획은 단일 query latency뿐 아니라 전체 system resource 사용량 관점으로 봐야 합니다.

## Replication / HA 구조

${matrix.replication}

### HA 판단 기준

- replication lag는 전송 지연과 apply 지연을 분리해서 확인합니다.
- failover 절차는 promotion 이후 application endpoint, DNS, connection pool, read/write routing까지 포함해야 합니다.
- synchronous replication은 데이터 손실 가능성을 줄이지만 commit latency와 장애 전파 가능성을 높입니다.
- logical replication과 physical replication은 schema 변경, DDL 전파, conflict 처리 방식이 다릅니다.
- read replica는 성능 확장 수단이지만 read-your-writes 요구가 있으면 routing 기준이 필요합니다.

## Backup / Recovery 구조

${matrix.backup}

### 복구 기준

- RPO와 RTO를 수치로 정하고 backup 방식이 이를 만족하는지 검증합니다.
- backup 성공 여부보다 restore rehearsal 성공 여부를 더 중요한 운영 지표로 둡니다.
- PITR은 base backup과 log/archive chain이 모두 정상이어야 합니다.
- 암호화, 압축, network 전송, object storage lifecycle이 restore 시간에 영향을 줍니다.
- schema migration 직후에는 backup compatibility와 rollback 가능성을 별도로 확인합니다.

## Monitoring / Observability

${matrix.monitoring}

### 필수 지표

- connection: active, idle, waiting, pool queue length
- latency: average가 아니라 p95, p99, timeout count
- SQL: top SQL, rows examined/returned, buffer gets, disk reads
- lock: blocker, waiter, wait duration, deadlock count
- memory: cache hit, temp spill, work memory pressure, swap
- storage: data file, log/archive/WAL/binlog, temp, backup usage
- replication: send/write/flush/replay/apply lag
- background: checkpoint, vacuum/purge, archiver, backup duration

### 경보 설계

- 단일 metric threshold보다 증상 조합을 사용합니다.
- replication lag와 application stale read error를 연결합니다.
- disk 사용률은 data와 log/archive 영역을 분리합니다.
- lock wait는 평균이 아니라 가장 오래 기다린 session을 봅니다.
- top SQL 변화는 배포와 통계 갱신 이벤트와 함께 기록합니다.

## 주요 파라미터

${list(matrix.params)}

### 파라미터 변경 절차

- parameter 적용 단위가 session, database, instance, cluster 중 무엇인지 확인합니다.
- restart 또는 failover가 필요한지 확인합니다.
- 변경 전후 비교 지표를 정하고, peak 시간대 전후로 관측합니다.
- managed service의 parameter group 반영 시점과 pending-reboot 상태를 확인합니다.
- 여러 parameter를 동시에 변경하지 않고 원인 추적이 가능한 단위로 나눕니다.
- rollback 값을 미리 기록합니다.

## 진단 쿼리

${dialectSqlBlock(
  matrix.sql.join("\n\n"),
  dbms === "MySQL" ? "mysql" : dbms === "PostgreSQL" ? "postgresql" : "oracle"
)}

## 장애 분석 절차

- 장애 시작 시각과 배포, DDL, batch, backup, 통계 갱신 이벤트를 같은 timeline에 놓습니다.
- connection pool timeout인지 DB 내부 wait인지 구분합니다.
- active session을 CPU 실행, lock wait, I/O wait, log flush wait, idle transaction으로 분류합니다.
- top SQL과 top wait event를 동시에 확인합니다.
- 실행 계획이 변경되었는지 plan hash 또는 plan text를 비교합니다.
- log/archive/WAL/binlog 증가량과 disk 여유 공간을 확인합니다.
- replication lag가 있으면 primary commit 지연인지 replica apply 지연인지 분리합니다.
- 완화 조치 후 p95/p99 latency와 error rate가 실제로 회복되었는지 확인합니다.

## 운영 리스크

${list(matrix.risks)}

- connection 수를 늘리는 조치는 DB 처리량을 늘리는 조치가 아니라 queue 위치를 바꿀 수 있습니다.
- memory parameter 증가는 OS cache, swap, colocated process에 영향을 줄 수 있습니다.
- log flush durability를 낮추면 성능은 좋아질 수 있지만 장애 시 손실 가능성이 커집니다.
- 통계 갱신은 query 성능을 개선할 수 있지만 plan regression도 유발할 수 있습니다.
- replica 기반 읽기 분산은 lag와 consistency 요구사항을 명확히 하지 않으면 데이터 정합성 이슈가 됩니다.
- backup retention을 늘리면 storage 비용과 restore catalog 관리 비용이 증가합니다.
- 운영 중 DDL은 metadata lock, table rewrite, replication 지연을 만들 수 있습니다.

## 용량 산정 기준

- 데이터 증가율, index 증가율, archive/WAL/binlog 증가율을 별도로 기록합니다.
- peak write TPS 기준으로 log volume을 산정합니다.
- backup retention과 restore rehearsal에 필요한 임시 공간을 포함합니다.
- connection 수는 application instance 수와 pool size의 곱으로 계산합니다.
- memory는 global 영역과 session 작업 영역을 분리합니다.
- replica는 primary와 같은 query를 처리하지 않으므로 별도의 workload 기준으로 산정합니다.
- 장애 시 traffic shift를 고려해 remaining node가 감당할 수 있는 capacity를 계산합니다.

## 공식문서 참고

${list(matrix.refs.map((ref) => {
  const [refDbms, title, url] = ref.split("|");
  return `${refDbms}: [${title}](${url})`;
}))}
`;

  return {
    id: matrix.id,
    slug: matrix.slug,
    title: `${dbms} Architecture`,
    description: matrix.description,
    category: "dbms" as DocumentCategory,
    level: "reference",
    status: "published" as const,
    published_at: now,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    tags: tagsFor(matrix.tags),
    official_docs: officialDocs(matrix.id, matrix.refs),
    content
  };
}

const commonSql = {
  mysqlDigest: "select digest_text, count_star, avg_timer_wait, sum_rows_examined from performance_schema.events_statements_summary_by_digest order by sum_timer_wait desc limit 10;",
  pgActivity: "select pid, state, wait_event_type, wait_event, query from pg_stat_activity where state <> 'idle';",
  oracleSession: "select sid, serial#, wait_class, event, blocking_session from v$session where status = 'ACTIVE';"
};

function deepDive(
  operatingModel: string,
  dbmsNotes: string[],
  dangerousConditions: string[],
  diagnostics: string[],
  operatingRules: string[]
): TopicDeepDive {
  return { operatingModel, dbmsNotes, dangerousConditions, diagnostics, operatingRules };
}

const derivedDeepDives: Record<string, TopicDeepDive> = {
  "Transaction Isolation": deepDive(
    "Isolation level은 read phenomenon 표가 아니라 실제 transaction retry, lock 범위, snapshot 수명, statement timeout 설계와 연결해서 판단해야 합니다. 동일한 Repeatable Read라도 MySQL InnoDB는 gap/next-key lock과 결합되고, PostgreSQL은 snapshot isolation에 가까운 동작과 serialization failure를 구분해야 하며, Oracle은 statement-level consistent read와 Serializable 충돌 처리를 기준으로 분석합니다.",
    [
      "MySQL은 기본 Repeatable Read에서 consistent read와 locking read를 구분합니다. SELECT는 snapshot을 읽지만 SELECT ... FOR UPDATE, UPDATE, DELETE는 index access path에 따라 record/gap/next-key lock을 잡을 수 있습니다.",
      "PostgreSQL은 Read Committed에서 statement마다 snapshot이 달라지고 Repeatable Read에서는 transaction snapshot을 유지합니다. Serializable은 SSI 기반으로 serialization failure가 발생할 수 있으므로 application retry가 설계되어야 합니다.",
      "Oracle은 Read Committed에서도 statement 단위 consistent read를 제공합니다. Serializable에서는 ORA-08177 같은 충돌이 발생할 수 있고, 긴 query는 undo retention과 연결됩니다."
    ],
    [
      "긴 report transaction을 Repeatable Read 또는 Serializable로 실행하면서 OLTP write와 같은 table을 읽는 경우 위험합니다.",
      "application retry가 없는 상태에서 Serializable을 적용하면 충돌이 오류로 노출됩니다.",
      "MySQL에서 range update를 낮은 선택도 index 또는 full scan으로 수행하면 gap/next-key lock 범위가 커집니다.",
      "batch가 큰 transaction 하나로 실행되면 rollback 시간, undo/WAL/redo, replication apply 시간이 함께 증가합니다.",
      "isolation level을 올려 정합성을 확보하려고 하지만 실제 문제는 idempotency나 unique constraint 부재인 경우 위험합니다."
    ],
    [
      "transaction 시작 시각과 현재 실행 중인 SQL을 함께 확인합니다.",
      "lock wait가 isolation level 변경 이후 증가했는지 배포 이력과 맞춥니다.",
      "serialization failure, deadlock, lock timeout을 같은 오류로 묶지 말고 각각 집계합니다.",
      "read-only report와 write transaction의 시간대를 분리해 version retention 압력을 확인합니다.",
      "실행 계획 변경으로 locking read의 access path가 바뀌었는지 확인합니다."
    ],
    [
      "정합성 요구를 isolation level만으로 해결하지 말고 unique constraint, idempotency key, optimistic locking과 함께 설계합니다.",
      "Serializable을 사용할 때는 retry budget과 최대 재시도 횟수를 application에 둡니다.",
      "긴 읽기 transaction은 별도 replica, snapshot export, report DB 같은 경로로 분리합니다.",
      "batch transaction은 chunk 단위 commit과 재시작 가능성을 기준으로 설계합니다.",
      "isolation 변경은 global default보다 workload별 session 설정으로 제한해서 검증합니다."
    ]
  ),
  Lock: deepDive(
    "Lock 분석은 대기 중인 SQL만 보는 작업이 아니라 blocker transaction의 시작점, lock 획득 순서, access path, DDL 여부, application timeout/retry를 재구성하는 절차입니다. 같은 row lock이라도 index가 없으면 훨씬 넓은 범위를 scan하면서 lock을 잡고, schema/metadata lock은 짧은 DDL도 전체 요청 지연으로 확산시킬 수 있습니다.",
    [
      "MySQL은 InnoDB row lock 외에 metadata lock이 중요합니다. DDL은 대기 중인 장기 SELECT 때문에 막히고, 뒤따르는 DML도 같은 metadata lock queue에 묶일 수 있습니다.",
      "PostgreSQL은 row lock, relation lock, predicate lock, advisory lock을 pg_locks로 확인합니다. idle in transaction 세션이 vacuum과 DDL까지 막을 수 있습니다.",
      "Oracle은 enqueue, row lock, library cache lock, latch wait를 구분해야 합니다. blocking_session만으로 부족하면 ASH/AWR에서 wait chain을 봅니다."
    ],
    [
      "운영 중 대형 table에 table rewrite가 필요한 DDL을 실행하는 경우 위험합니다.",
      "외래키 column에 index가 없어 parent row delete/update가 child table lock 경합을 만드는 경우 위험합니다.",
      "같은 업무를 여러 transaction이 서로 다른 순서로 update하면 deadlock이 반복됩니다.",
      "timeout을 짧게 줄였지만 application이 즉시 재시도하면 lock storm이 발생할 수 있습니다.",
      "full scan UPDATE/DELETE는 결과 row 수가 적어도 scan 과정에서 넓은 lock과 undo/log를 만들 수 있습니다."
    ],
    [
      "blocking chain의 최상위 blocker를 찾고 해당 transaction 시작 시각과 마지막 SQL을 확인합니다.",
      "victim query가 아니라 blocker가 왜 commit/rollback하지 않는지 확인합니다.",
      "DDL 직후 장애라면 metadata/schema lock queue를 먼저 봅니다.",
      "deadlock log에서 lock 획득 순서를 업무 flow 기준으로 다시 씁니다.",
      "index 부재로 scan 범위가 커졌는지 실행 계획을 확인합니다."
    ],
    [
      "운영 DDL은 lock timeout, statement timeout, online DDL 지원 범위, rollback 방식을 미리 정합니다.",
      "transaction 안에서 외부 API 호출이나 사용자 입력 대기를 하지 않습니다.",
      "동일 aggregate를 수정하는 transaction은 lock 획득 순서를 고정합니다.",
      "대량 변경은 primary key range 기준으로 chunk 처리하고 각 chunk마다 commit합니다.",
      "lock 지표는 평균보다 가장 오래 기다린 session과 blocker 수를 기준으로 경보를 둡니다."
    ]
  ),
  "Execution Plan": deepDive(
    "Execution Plan은 SQL이 어떤 순서와 access path로 데이터를 읽는지 보여주지만, plan text만으로 좋고 나쁨을 판단하면 안 됩니다. 핵심은 estimated rows와 actual rows의 차이, buffer/cache 사용량, temp spill, join order, predicate pushdown 여부를 workload 기준으로 해석하는 것입니다.",
    [
      "MySQL EXPLAIN의 type, key, rows, filtered는 추정 정보이며 EXPLAIN ANALYZE로 실제 rows와 time을 확인해야 합니다. Using filesort와 Using temporary는 결과 크기와 memory 사용량을 함께 봅니다.",
      "PostgreSQL EXPLAIN (ANALYZE, BUFFERS)은 actual time, loops, shared hit/read, temp read/write를 제공합니다. loops가 큰 nested loop는 row 추정 오차와 결합될 때 급격히 느려집니다.",
      "Oracle DBMS_XPLAN.DISPLAY_CURSOR의 ALLSTATS LAST, predicate information, plan hash value를 함께 봅니다. child cursor, bind peeking, adaptive cursor sharing 때문에 같은 SQL에 여러 plan이 존재할 수 있습니다."
    ],
    [
      "production과 다른 통계/데이터 분포를 가진 staging에서 plan만 보고 index를 추가하는 경우 위험합니다.",
      "평균 실행 시간만 보고 특정 bind 값에서만 느린 skew 문제를 놓치는 경우 위험합니다.",
      "small table의 full scan을 무조건 문제로 보고 불필요한 index를 추가하면 write 비용만 늘 수 있습니다.",
      "plan cache에 남은 계획과 실제 새 connection에서 쓰는 계획을 혼동하면 원인 분석이 빗나갑니다.",
      "EXPLAIN ANALYZE가 실제 query를 실행한다는 점을 고려하지 않고 변경 query에 실행하는 경우 위험합니다."
    ],
    [
      "추정 row와 실제 row가 10배 이상 차이 나는 node를 먼저 찾습니다.",
      "I/O 병목이면 buffer read와 physical read를 확인하고, CPU 병목이면 function/cast/sort 비용을 확인합니다.",
      "join 순서가 바뀐 시점과 통계 갱신, parameter 변경, index 생성 시점을 맞춥니다.",
      "temp spill이 있으면 sort/hash 대상 row 수와 memory parameter를 확인합니다.",
      "같은 SQL의 여러 plan hash 또는 queryid/sql_id별 plan 변화를 비교합니다."
    ],
    [
      "plan 캡처는 SQL text, bind 값, row count, 통계 시각, parameter 값을 함께 기록합니다.",
      "index 추가 전 query rewrite와 통계 개선으로 해결 가능한지 먼저 확인합니다.",
      "튜닝 결과는 단일 query latency가 아니라 전체 buffer read, CPU, write 비용까지 포함해 판단합니다.",
      "plan regression 대응에는 rollback 가능한 index, SQL hint/profile/baseline 적용 범위를 제한합니다.",
      "실행 계획 문서에는 좋았던 plan보다 나빠지는 조건을 더 명확히 남깁니다."
    ]
  ),
  "Optimizer Statistics": deepDive(
    "Optimizer Statistics는 table 크기, column cardinality, histogram, correlation, distinct count를 통해 비용 기반 계획을 선택하게 합니다. 통계 수집은 유지보수 작업이지만 동시에 plan 변경 이벤트이므로, 수집 주기와 plan 안정성 사이의 trade-off를 운영 기준으로 관리해야 합니다.",
    [
      "MySQL InnoDB persistent statistics와 histogram은 cardinality 추정에 영향을 줍니다. sample page 수가 낮거나 데이터 skew가 크면 index 선택이 흔들릴 수 있습니다.",
      "PostgreSQL은 pg_statistic, default_statistics_target, extended statistics를 사용합니다. 다중 column 상관관계가 크면 단일 column 통계만으로 join/selectivity 추정이 틀릴 수 있습니다.",
      "Oracle CBO는 object/system statistics, histogram, dynamic sampling, SQL plan management와 결합됩니다. 통계 수집 직후 plan hash가 바뀌는지 확인해야 합니다."
    ],
    [
      "대량 적재 직후 ANALYZE/GATHER_STATS 없이 운영 query가 실행되는 경우 위험합니다.",
      "데이터 skew가 큰 column에 histogram 없이 equality predicate가 많은 경우 위험합니다.",
      "partition table에서 global/local 통계가 맞지 않으면 pruning과 join order가 흔들립니다.",
      "통계 수집 job이 peak 시간대에 돌면서 I/O와 plan 변화를 동시에 만드는 경우 위험합니다.",
      "통계 고정 또는 plan baseline을 장기간 방치하면 데이터 증가 후 더 나쁜 plan을 유지할 수 있습니다."
    ],
    [
      "통계 최신 시각과 row count 추정이 실제 row count와 맞는지 확인합니다.",
      "plan regression 발생 시 통계 수집 job 실행 시각을 timeline에 표시합니다.",
      "skew column의 histogram 존재 여부와 bucket 수를 확인합니다.",
      "multi-column predicate가 많으면 extended statistics 또는 column group 통계 필요성을 검토합니다.",
      "partition별 통계와 전체 통계가 모두 갱신되었는지 확인합니다."
    ],
    [
      "통계 수집은 배포처럼 change event로 기록합니다.",
      "대량 DML 이후 통계 갱신을 batch 절차에 포함합니다.",
      "통계 target 증가는 planner 품질을 높일 수 있지만 analyze 비용과 catalog 크기를 함께 봅니다.",
      "plan 안정성이 중요한 SQL은 baseline/profile/hint보다 먼저 통계 품질을 점검합니다.",
      "통계 변경 후 top SQL의 plan과 p95/p99 latency를 다음 peak까지 관측합니다."
    ]
  ),
  Partitioning: deepDive(
    "Partitioning은 큰 table을 논리적으로 나누는 기능이지만 성능 기능이 아니라 운영 단위 분리 기능에 가깝습니다. partition pruning이 실패하면 partition 수만큼 overhead가 늘고, partition key와 업무 query 패턴이 맞지 않으면 오히려 index와 maintenance 비용이 증가합니다.",
    [
      "MySQL은 partitioning에서 unique key와 partition key 제약을 함께 확인해야 합니다. 일부 ALTER PARTITION 작업은 metadata lock과 table copy 영향을 받을 수 있습니다.",
      "PostgreSQL declarative partitioning은 pruning, partition-wise join/aggregate, attach/detach 방식이 version별로 개선되었습니다. partition 수가 많으면 planning overhead와 autovacuum 관리가 중요합니다.",
      "Oracle은 range/list/hash/composite partition, local/global index, partition exchange 같은 운영 기능이 강합니다. global index maintenance와 online operation 가능 범위를 확인해야 합니다."
    ],
    [
      "WHERE 조건에 partition key가 없거나 함수로 감싸 pruning이 실패하는 경우 위험합니다.",
      "partition 수가 너무 많아 planning time, catalog bloat, maintenance job이 증가하는 경우 위험합니다.",
      "global index가 있는 table에서 partition drop/truncate를 단순 삭제처럼 생각하면 위험합니다.",
      "시간 기준 partition인데 late-arriving data가 많으면 routing과 constraint가 복잡해집니다.",
      "primary key/unique key 요구가 partition key와 맞지 않으면 설계가 흔들립니다."
    ],
    [
      "실행 계획에서 실제로 몇 개 partition을 읽는지 확인합니다.",
      "partition별 row count, size, bloat, vacuum/analyze 시각을 비교합니다.",
      "새 partition 생성 job과 retention drop job이 실패했는지 확인합니다.",
      "partition maintenance 중 lock wait와 replication lag가 증가했는지 봅니다.",
      "global/local index의 상태와 rebuild 필요성을 확인합니다."
    ],
    [
      "partition key는 retention, query predicate, write distribution을 동시에 만족해야 합니다.",
      "새 partition 사전 생성과 오래된 partition 제거를 자동화하고 실패 경보를 둡니다.",
      "대형 table migration은 partition exchange/attach/detach 같은 metadata operation을 우선 검토합니다.",
      "partition 수 상한과 archive 정책을 운영 규칙으로 둡니다.",
      "partitioning 도입 전 non-partitioned table 대비 plan과 maintenance 비용을 수치로 비교합니다."
    ]
  ),
  Replication: deepDive(
    "Replication은 읽기 분산, 장애 대응, 데이터 배포를 위한 구조이지만 데이터 정합성을 자동으로 보장하지 않습니다. lag는 network 전송, log flush, apply worker, long transaction, DDL, 대량 DML에 의해 발생하며 application routing 정책과 함께 관리해야 합니다.",
    [
      "MySQL replication은 binary log, GTID, relay log, replica SQL thread/worker를 기준으로 봅니다. row-based replication은 DML 재현성이 높지만 log volume이 커질 수 있습니다.",
      "PostgreSQL streaming replication은 WAL 전송과 replay 위치를 봅니다. replication slot은 편리하지만 inactive slot이 WAL 삭제를 막아 disk pressure를 만들 수 있습니다.",
      "Oracle Data Guard는 redo transport와 apply lag를 분리해 봅니다. Maximum Protection/Availability/Performance 모드에 따라 commit latency와 데이터 손실 허용 범위가 달라집니다."
    ],
    [
      "read-your-writes가 필요한 요청을 lag 있는 replica로 보내는 경우 위험합니다.",
      "대량 DDL/DML 후 replica apply가 따라오지 못하는데 traffic을 계속 보내면 stale read가 누적됩니다.",
      "logical replication에서 schema 변경 순서와 DDL 전파를 검증하지 않으면 apply 오류가 발생할 수 있습니다.",
      "inactive replication slot 또는 archive destination 장애를 방치하면 primary disk가 찰 수 있습니다.",
      "failover 후 old primary 재합류 절차가 없으면 split-brain 또는 데이터 덮어쓰기 위험이 있습니다."
    ],
    [
      "send/write/flush/replay/apply lag를 가능한 한 단계별로 분리합니다.",
      "lag 증가 시점의 top write SQL, batch, DDL, backup job을 확인합니다.",
      "replica SQL/apply worker가 CPU, I/O, lock 중 어디서 막히는지 확인합니다.",
      "replication error log와 skipped transaction 여부를 확인합니다.",
      "failover rehearsal에서 promotion 시간, application reconnect 시간, DNS/cache 시간을 측정합니다."
    ],
    [
      "replica read는 stale read 허용 업무에만 연결하고, 필요하면 primary read fallback 기준을 둡니다.",
      "lag threshold를 넘으면 read traffic을 차단하거나 degrade 모드로 전환합니다.",
      "batch write는 replica apply capacity까지 고려해 chunk와 sleep을 조정합니다.",
      "replication slot, archive log, binlog retention은 disk 경보와 연결합니다.",
      "failover runbook에는 promote, endpoint 변경, old primary 격리, 재동기화 절차를 포함합니다."
    ]
  ),
  "Materialized View": deepDive(
    "Materialized View는 복잡한 query 결과를 미리 저장해 읽기 비용을 줄이지만, refresh 비용과 stale data 허용 범위를 운영 계약으로 관리해야 합니다. refresh 방식이 전체 재생성인지 증분인지, refresh 중 lock과 query rewrite가 어떻게 동작하는지 DBMS별로 크게 다릅니다.",
    [
      "MySQL은 내장 materialized view 기능이 일반적이지 않아 summary table과 event/job 기반 refresh로 구현하는 경우가 많습니다. transaction 경계와 원본 변경 추적을 application 또는 job이 책임집니다.",
      "PostgreSQL materialized view는 REFRESH MATERIALIZED VIEW를 사용하며 CONCURRENTLY 옵션에는 unique index 요구와 성능 비용이 있습니다. refresh 중 stale data와 lock 범위를 확인해야 합니다.",
      "Oracle은 materialized view log, fast refresh, complete refresh, query rewrite 기능이 강합니다. refresh group, staleness, optimizer rewrite 조건을 관리해야 합니다."
    ],
    [
      "실시간 정합성이 필요한 화면을 materialized view에 연결하는 경우 위험합니다.",
      "refresh 시간이 원본 데이터 변경 주기보다 길어지면 backlog가 누적됩니다.",
      "complete refresh가 peak 시간대에 실행되어 원본 table과 temp/undo/redo를 압박하는 경우 위험합니다.",
      "refresh 실패 시 마지막 성공 시각을 표시하지 않으면 오래된 데이터가 정상처럼 보입니다.",
      "query rewrite가 켜져 있지만 staleness 허용 범위를 모르면 예상과 다른 결과를 줄 수 있습니다."
    ],
    [
      "마지막 refresh 시작/종료/성공 시각과 소요 시간을 기록합니다.",
      "refresh query의 실행 계획과 temp spill, log 증가량을 확인합니다.",
      "원본 table 변경량과 refresh 처리량을 비교합니다.",
      "refresh 중 reader/writer lock wait가 발생하는지 확인합니다.",
      "stale data가 업무적으로 허용되는 최대 시간을 수치로 확인합니다."
    ],
    [
      "materialized view마다 freshness SLO를 정의합니다.",
      "refresh 실패 시 alert와 fallback query 또는 stale banner 정책을 둡니다.",
      "complete refresh가 커지면 incremental refresh, partition refresh, summary table 재설계를 검토합니다.",
      "refresh job은 retry 가능하고 idempotent해야 합니다.",
      "query rewrite를 사용할 때는 rewrite 대상 SQL과 결과 동일성을 테스트로 고정합니다."
    ]
  ),
  "Full Text Search": deepDive(
    "Full Text Search는 LIKE 검색의 대체재가 아니라 tokenizer, language dictionary, ranking, index maintenance를 가진 검색 기능입니다. DB 내 검색으로 충분한 범위와 별도 검색 엔진이 필요한 범위를 구분해야 하며, 언어별 형태소 처리와 정렬 요구가 운영 품질을 좌우합니다.",
    [
      "MySQL FULLTEXT index는 InnoDB에서 사용할 수 있으며 parser, stopword, minimum token length 영향을 받습니다. ngram parser는 CJK 검색에서 중요하지만 index 크기와 결과 품질을 함께 봐야 합니다.",
      "PostgreSQL은 tsvector, tsquery, GIN/GiST index, dictionary configuration을 사용합니다. ranking과 highlighting은 query 비용을 증가시킬 수 있습니다.",
      "Oracle Text는 CONTEXT/CTXCAT index와 lexer, datastore, section group 등 기능을 제공합니다. index synchronization과 optimize 작업이 운영 포인트입니다."
    ],
    [
      "정확한 필터링과 정렬이 필요한 업무 query를 full text ranking에만 의존하는 경우 위험합니다.",
      "언어 tokenizer를 검증하지 않고 한국어/일본어/중국어 검색 품질을 기대하면 위험합니다.",
      "대량 업데이트가 많은 column에 full text index를 붙이면 index maintenance 비용이 커집니다.",
      "검색 결과 freshness 요구가 높은데 index sync 주기가 길면 업무 문제가 됩니다.",
      "prefix, typo tolerance, synonym, relevance tuning 요구가 커지면 DB 내 검색만으로 한계가 있을 수 있습니다."
    ],
    [
      "검색어별 hit count, latency, top SQL, index scan 여부를 확인합니다.",
      "tokenization 결과를 샘플 문서로 직접 확인합니다.",
      "index 크기와 update/delete 시 유지 비용을 측정합니다.",
      "ranking 계산이 CPU 병목인지, filter 조건이 먼저 적용되는지 실행 계획을 봅니다.",
      "검색 실패/무결과 query를 수집해 dictionary와 synonym 개선 대상인지 확인합니다."
    ],
    [
      "검색 요구사항을 exact match, prefix, phrase, relevance, faceting, typo tolerance로 나눕니다.",
      "DB full text는 transaction data와 가까운 단순 검색에 우선 적용하고, 복잡한 relevance는 검색 엔진 분리를 검토합니다.",
      "언어별 tokenizer 설정과 stopword를 배포 산출물로 관리합니다.",
      "검색 index rebuild/sync 작업은 batch window와 replication lag를 고려합니다.",
      "검색 품질 평가는 latency뿐 아니라 대표 query set의 precision/recall로 확인합니다."
    ]
  ),
  "Monitoring / Observability": deepDive(
    "Monitoring은 dashboard를 많이 만드는 일이 아니라 장애 질문에 답할 수 있는 지표 연결을 만드는 일입니다. connection, SQL, wait, lock, I/O, log, replication, backup 지표가 같은 timeline에서 보여야 원인과 증상을 분리할 수 있습니다.",
    [
      "MySQL은 Performance Schema, sys schema, slow query log, SHOW ENGINE INNODB STATUS를 함께 씁니다. statement digest와 wait summary를 연결해야 SQL 비용과 wait 원인을 볼 수 있습니다.",
      "PostgreSQL은 pg_stat_activity, pg_stat_statements, pg_locks, pg_stat_database, pg_stat_bgwriter, pg_stat_replication을 사용합니다. extension 설치와 queryid 정책을 관리해야 합니다.",
      "Oracle은 AWR, ASH, V$SESSION, V$SQL, V$SYSTEM_EVENT, DBMS_XPLAN을 중심으로 wait-class 기반 분석을 수행합니다. license와 retention 정책을 확인해야 합니다."
    ],
    [
      "CPU, memory, disk 사용률만 보고 SQL/wait/lock 지표가 없는 경우 위험합니다.",
      "평균 latency만 보고 p95/p99 timeout을 놓치는 경우 위험합니다.",
      "primary와 replica 지표를 합쳐서 lag나 stale read를 숨기는 경우 위험합니다.",
      "top SQL 수집이 비활성화되어 장애 후 원인 SQL을 재구성할 수 없는 경우 위험합니다.",
      "경보가 너무 많아 실제 장애 신호를 묻어버리는 경우 위험합니다."
    ],
    [
      "장애 timeline에 배포, DDL, batch, backup, 통계 수집 이벤트를 같이 표시합니다.",
      "top SQL과 top wait event가 같은 시간대에 움직이는지 확인합니다.",
      "connection pool 대기와 DB active session을 비교해 queue 위치를 찾습니다.",
      "lock wait는 blocker 수, 최장 대기 시간, 피해 session 수로 봅니다.",
      "replication lag는 전송/apply/read routing 지표와 연결합니다."
    ],
    [
      "모든 DB에는 최소 top SQL, active session, lock, replication, log/archive 용량 dashboard를 둡니다.",
      "경보는 조치 가능한 runbook 링크와 함께 둡니다.",
      "metric retention은 장애 분석 기간과 release cycle보다 길게 잡습니다.",
      "관측용 query 자체가 DB 부하가 되지 않도록 sampling과 interval을 관리합니다.",
      "신규 기능 배포 시 필요한 DB 지표를 함께 추가합니다."
    ]
  ),
  "Large Upload": deepDive(
    "Large Upload는 파일 수신 문제가 아니라 staging, validation, bulk load, transaction boundary, index maintenance, redo/WAL/undo, error recovery가 결합된 운영 절차입니다. 전체를 하나의 transaction으로 처리하면 실패 시 rollback과 재처리 비용이 커집니다.",
    [
      "MySQL은 LOAD DATA, multi-row insert, staging table을 사용할 수 있습니다. unique check, foreign key check, binlog volume, replica lag를 함께 봅니다.",
      "PostgreSQL은 COPY가 대량 적재에 유리합니다. WAL volume, autovacuum/analyze, constraint validation, temporary file 사용을 확인합니다.",
      "Oracle은 SQL*Loader, external table, direct path insert를 검토합니다. NOLOGGING 사용은 복구 가능성과 Data Guard 영향까지 확인해야 합니다."
    ],
    [
      "사용자 업로드 파일을 검증 없이 운영 table에 바로 적재하는 경우 위험합니다.",
      "대용량 파일 하나를 단일 transaction으로 처리하면 lock, rollback, replication lag가 커집니다.",
      "중복 처리 idempotency가 없으면 재시도 시 데이터가 중복됩니다.",
      "index와 constraint를 모두 활성화한 채 무제한 병렬 적재하면 write path가 포화됩니다.",
      "NOLOGGING 또는 durability 완화 옵션을 복구 정책 없이 사용하는 경우 위험합니다."
    ],
    [
      "파일 크기, row 수, 실패 row 수, 처리 시간, commit 단위를 기록합니다.",
      "적재 중 redo/WAL/binlog 증가량과 replica lag를 확인합니다.",
      "staging table에서 validation error 유형을 집계합니다.",
      "적재 SQL의 lock wait와 constraint check 비용을 확인합니다.",
      "적재 후 통계 갱신과 실행 계획 변화를 확인합니다."
    ],
    [
      "업로드는 staging, validation, promotion 단계로 나눕니다.",
      "각 chunk는 idempotent하게 재실행 가능해야 합니다.",
      "업무 table 반영은 작은 transaction 단위로 나누고 progress marker를 둡니다.",
      "대량 적재 window와 backup/replication capacity를 함께 예약합니다.",
      "실패 파일은 원본, validation 결과, 재처리 상태를 보관합니다."
    ]
  ),
  "Batch Insert": deepDive(
    "Batch Insert는 network round trip을 줄이는 효과가 있지만 transaction 크기, log flush, index maintenance, lock 보유 시간, replication apply 비용을 함께 증가시킬 수 있습니다. 적절한 batch size는 DBMS와 storage, index 수, 동시성에 따라 달라집니다.",
    [
      "MySQL은 multi-row insert, LOAD DATA, autocommit off를 사용할 수 있습니다. innodb_flush_log_at_trx_commit, sync_binlog, secondary index 수가 latency에 영향을 줍니다.",
      "PostgreSQL은 COPY와 multi-values insert가 일반적입니다. WAL compression, synchronous_commit, checkpoint, autovacuum/analyze가 적재 후 성능에 영향을 줍니다.",
      "Oracle은 array bind, direct path insert, append hint를 사용할 수 있습니다. redo/undo, index maintenance, segment space management를 함께 봅니다."
    ],
    [
      "batch size를 크게 하면 무조건 빠르다고 보고 rollback 시간과 memory를 무시하는 경우 위험합니다.",
      "중복 key 오류 하나 때문에 전체 batch가 실패하고 재시도 중복이 발생하는 경우 위험합니다.",
      "secondary index가 많은 table에 high concurrency batch insert를 넣으면 latch/I/O/log 병목이 커집니다.",
      "replica apply capacity보다 빠르게 insert하면 read replica가 장시간 뒤처집니다.",
      "sequence/auto increment hotspot 또는 monotonically increasing key가 page contention을 만들 수 있습니다."
    ],
    [
      "batch size별 rows/sec, p95 latency, log volume, replication lag를 측정합니다.",
      "실패 row 처리 방식이 전체 rollback인지 partial reject인지 확인합니다.",
      "index 수와 foreign key check 비용을 측정합니다.",
      "commit 빈도와 log flush wait를 확인합니다.",
      "적재 후 table/index 통계와 bloat/fragmentation을 확인합니다."
    ],
    [
      "batch size는 고정값이 아니라 log flush와 replica lag 기준으로 조정합니다.",
      "재시도는 idempotency key 또는 staging primary key로 중복을 막습니다.",
      "대량 적재 전후 통계 갱신과 plan 확인을 절차에 넣습니다.",
      "업무 peak와 batch insert window를 분리합니다.",
      "장애 시 중단 지점부터 재개할 수 있게 progress checkpoint를 둡니다."
    ]
  ),
  "Read Replica": deepDive(
    "Read Replica는 읽기 부하를 분산하지만 정합성 요구를 자동으로 만족하지 않습니다. 사용자는 primary에 쓴 직후 replica에서 읽을 수 있으며, 이때 lag가 있으면 stale read가 정상 동작처럼 발생합니다.",
    [
      "MySQL replica는 Seconds_Behind_Source만으로 충분하지 않습니다. relay log 위치, worker 지연, GTID set, SQL thread 상태를 함께 봅니다.",
      "PostgreSQL standby는 replay lag와 hot standby conflict, replication slot WAL retention을 확인합니다. long query가 replay를 막거나 취소될 수 있습니다.",
      "Oracle Active Data Guard는 apply lag, query offload, real-time apply 상태를 봅니다. Data Guard mode에 따라 commit latency와 lag 특성이 다릅니다."
    ],
    [
      "로그인 직후 내 정보 조회처럼 read-after-write가 필요한 요청을 replica로 보내는 경우 위험합니다.",
      "lag가 큰데 cache warm-up이나 report query를 계속 replica에 보내면 lag가 더 커질 수 있습니다.",
      "replica를 백업과 analytics와 application read에 동시에 사용하면 I/O 경합이 발생합니다.",
      "failover 후 application이 old replica endpoint를 계속 읽으면 데이터 정합성 문제가 생깁니다.",
      "replica가 primary보다 작은 instance인데 같은 query 부하를 기대하는 경우 위험합니다."
    ],
    [
      "업무별 stale read 허용 시간을 정의하고 실제 lag percentile과 비교합니다.",
      "lag 증가 시점의 write volume, long transaction, DDL, report query를 확인합니다.",
      "replica query가 replay/apply를 막는지 확인합니다.",
      "read routing 로그에서 어떤 요청이 replica로 갔는지 확인합니다.",
      "promotion rehearsal 후 endpoint와 connection pool이 정상 전환되는지 확인합니다."
    ],
    [
      "read-after-write 요청은 primary로 보내거나 session consistency token을 사용합니다.",
      "lag threshold를 넘으면 replica read를 자동 차단합니다.",
      "analytics와 backup용 replica는 application read replica와 분리합니다.",
      "replica capacity는 primary의 복사본이 아니라 별도 workload 기준으로 산정합니다.",
      "routing 정책은 코드와 운영 문서에 함께 남깁니다."
    ]
  ),
  "Large Table Migration": deepDive(
    "Large Table Migration은 DDL 하나가 아니라 expand, backfill, dual write, verify, cutover, rollback으로 나뉘는 변경 절차입니다. 대형 table에서는 lock 시간보다 backfill이 만드는 log volume, replication lag, cache churn이 더 큰 문제가 될 수 있습니다.",
    [
      "MySQL은 online DDL 알고리즘, metadata lock, pt-online-schema-change/gh-ost 같은 도구 사용 여부를 검토합니다. instant/inplace/copy 여부가 version과 DDL 종류별로 다릅니다.",
      "PostgreSQL은 ALTER TABLE 종류에 따라 table rewrite 여부가 다릅니다. NOT NULL, DEFAULT, index concurrently, constraint validation 단계 분리가 중요합니다.",
      "Oracle은 online redefinition, DBMS_REDEFINITION, partition exchange, edition-based redefinition 등을 검토할 수 있습니다. undo/redo와 invalid object를 함께 확인합니다."
    ],
    [
      "대형 table에 rewrite DDL을 peak 시간대에 실행하는 경우 위험합니다.",
      "backfill을 한 transaction으로 처리해 undo/WAL/redo와 lock을 크게 만드는 경우 위험합니다.",
      "dual write 검증 없이 cutover하면 누락 데이터와 중복 데이터가 발생할 수 있습니다.",
      "rollback 기준을 정하지 않고 migration을 진행하면 장애 시 선택지가 줄어듭니다.",
      "replica lag를 무시하면 cutover 시점에 read 결과가 섞일 수 있습니다."
    ],
    [
      "DDL이 metadata only인지 table rewrite인지 공식문서와 staging에서 확인합니다.",
      "backfill chunk별 처리량, lag, lock wait, error count를 기록합니다.",
      "old/new schema 간 row count, checksum, sample query 결과를 비교합니다.",
      "dual write 실패율과 재처리 queue를 확인합니다.",
      "cutover 전후 top SQL plan과 index 사용 여부를 확인합니다."
    ],
    [
      "expand-contract 패턴을 기본으로 사용합니다.",
      "backfill은 primary key range 기반 chunk와 progress marker를 둡니다.",
      "cutover는 feature flag 또는 routing switch로 되돌릴 수 있게 합니다.",
      "rollback은 데이터 손실 없이 가능한 시점과 불가능한 시점을 명확히 표시합니다.",
      "migration 완료 후 old column/table 제거는 별도 배포로 분리합니다."
    ]
  ),
  "Backup / Recovery": deepDive(
    "Backup / Recovery의 기준은 백업 파일 존재가 아니라 목표 시점으로 실제 복구할 수 있는지입니다. RPO, RTO, PITR 가능 범위, 암호화 key, archive chain, restore rehearsal 결과가 함께 관리되어야 합니다.",
    [
      "MySQL은 logical dump, physical backup, clone, binary log 기반 PITR을 조합합니다. GTID와 binlog retention, backup lock, replica backup 전략을 확인합니다.",
      "PostgreSQL은 base backup, WAL archive, pg_dump, PITR을 사용합니다. archive_command 성공률과 replication slot/WAL retention을 함께 봅니다.",
      "Oracle은 RMAN, archived redo log, control file/spfile backup, flashback을 사용합니다. FRA 공간과 recovery catalog 정책이 중요합니다."
    ],
    [
      "백업 성공 알림만 있고 restore 테스트가 없는 경우 위험합니다.",
      "PITR에 필요한 log/binlog/WAL/archive chain 중 하나라도 누락되면 목표 시점 복구가 불가능합니다.",
      "암호화 key와 credential 복구 절차가 백업과 따로 관리되지 않으면 위험합니다.",
      "replica에서 백업을 수행하지만 replica lag와 consistency를 검증하지 않는 경우 위험합니다.",
      "schema migration 직후 old backup으로 rollback 가능한지 확인하지 않으면 장애 대응이 제한됩니다."
    ],
    [
      "최근 backup 파일과 log chain으로 staging restore를 수행합니다.",
      "목표 시각 PITR을 실제로 수행하고 row count/checksum을 비교합니다.",
      "backup duration, backup size, compression ratio, upload 실패율을 추적합니다.",
      "archive/WAL/binlog/FRA 사용률과 retention을 확인합니다.",
      "복구 후 application credential, extension, statistics, sequence 상태를 확인합니다."
    ],
    [
      "RPO/RTO를 업무별로 수치화합니다.",
      "backup job 성공보다 restore rehearsal 성공을 핵심 지표로 둡니다.",
      "backup과 archive log는 서로 다른 장애 도메인에 보관합니다.",
      "복구 절차는 담당자 없이도 실행 가능한 runbook으로 유지합니다.",
      "대형 변경 전에는 restore point 또는 rollback 가능한 backup을 별도로 확보합니다."
    ]
  ),
  "Connection Pool Exhaustion": deepDive(
    "Connection Pool Exhaustion은 DB max_connections 부족으로만 보면 안 됩니다. 실제 원인은 slow query, lock wait, idle transaction, connection leak, thread starvation, retry storm일 수 있으며 pool은 그 증상을 application queue로 드러냅니다.",
    [
      "MySQL은 max_connections, thread cache, active processlist, Performance Schema wait를 함께 봅니다. connection이 많아지면 memory와 context switching 비용이 증가합니다.",
      "PostgreSQL은 process-per-connection 구조라 connection 수 증가가 memory와 scheduler 비용으로 이어집니다. pgbouncer 같은 pooler 사용 시 transaction/session pooling 차이를 이해해야 합니다.",
      "Oracle은 processes/sessions 제한, dedicated/shared server, inactive session, open cursor를 함께 봅니다. connection storm은 listener와 server process 생성 비용을 키웁니다."
    ],
    [
      "pool size를 늘려 장애를 해결하려 하면 DB 동시 실행 수가 늘어 병목이 악화될 수 있습니다.",
      "connection leak가 있는데 max connection만 올리면 재발 시간이 늦춰질 뿐입니다.",
      "lock wait로 query가 반환되지 않아 pool이 마르는 경우 pool이 원인이 아닙니다.",
      "retry storm이 새 connection을 계속 요구하면 장애가 확대됩니다.",
      "transaction pooling에서 session state, prepared statement, temp table 의존 query를 실행하면 위험합니다."
    ],
    [
      "pool active/idle/waiting과 DB active/idle session을 같은 시간축에서 비교합니다.",
      "pool 대기 시작 시점의 top SQL, lock wait, DB wait event를 확인합니다.",
      "idle in transaction, 오래 열린 session, 마지막 query를 찾습니다.",
      "application instance 수와 pool max size의 곱이 DB limit을 넘는지 계산합니다.",
      "connection acquire timeout과 statement timeout, transaction timeout을 구분합니다."
    ],
    [
      "pool size는 DB 처리량, instance 수, query latency 기준으로 계산합니다.",
      "long query와 lock wait를 줄이지 않고 pool만 키우지 않습니다.",
      "connection leak detection과 max lifetime, idle timeout을 설정합니다.",
      "backpressure와 circuit breaker로 retry storm을 제한합니다.",
      "pool exhaustion runbook은 DB kill session보다 blocker 원인 제거를 우선합니다."
    ]
  ),
  "Deadlock Analysis": deepDive(
    "Deadlock Analysis는 DB가 선택한 victim SQL을 튜닝하는 작업이 아니라 transaction들이 어떤 순서로 어떤 자원을 잡았는지 재구성하는 작업입니다. 같은 deadlock이 반복되면 index 설계, transaction 순서, 업무 aggregate 경계 중 하나가 맞지 않는 경우가 많습니다.",
    [
      "MySQL InnoDB는 SHOW ENGINE INNODB STATUS의 latest detected deadlock에서 transaction, lock mode, index, query를 확인합니다. gap lock과 next-key lock이 deadlock에 포함될 수 있습니다.",
      "PostgreSQL은 deadlock_timeout 후 detector가 동작하고 log_lock_waits를 통해 대기 정보를 남길 수 있습니다. pg_locks만으로 사후 deadlock 전체를 재구성하기는 어렵기 때문에 log가 중요합니다.",
      "Oracle은 trace file, V$SESSION, ASH/AWR을 통해 enqueue deadlock과 blocking chain을 확인합니다. ORA-00060 trace에는 관련 SQL과 lock 정보가 남습니다."
    ],
    [
      "transaction A는 주문을 먼저 잡고 B는 결제를 먼저 잡는 식으로 lock 순서가 다르면 위험합니다.",
      "index 부재로 UPDATE가 넓은 범위를 scan하면서 예상보다 많은 row/index gap을 잠그면 위험합니다.",
      "deadlock을 단순 retry로만 숨기면 사용자 latency와 DB 부하가 증가합니다.",
      "외래키 index 누락은 parent/child 변경 시 예기치 않은 lock 경합을 만들 수 있습니다.",
      "batch와 OLTP가 같은 row set을 다른 순서로 갱신하면 반복 deadlock이 발생합니다."
    ],
    [
      "deadlock log에서 transaction별 lock 획득 순서를 표로 작성합니다.",
      "각 SQL의 실행 계획과 사용 index를 확인합니다.",
      "동일 오류가 특정 endpoint, batch, scheduler와 연결되는지 집계합니다.",
      "retry 성공률과 retry 후 latency를 측정합니다.",
      "deadlock 발생 시점의 동시 transaction 수와 lock wait 지표를 확인합니다."
    ],
    [
      "같은 aggregate를 갱신하는 모든 code path의 lock 순서를 통일합니다.",
      "deadlock retry는 제한된 횟수와 jitter를 두고 idempotent 작업에만 적용합니다.",
      "UPDATE/DELETE predicate에는 적절한 index를 둬 lock scan 범위를 줄입니다.",
      "batch는 OLTP와 같은 row를 같은 시간대에 갱신하지 않도록 window를 분리합니다.",
      "deadlock 분석 결과는 SQL이 아니라 업무 transaction 단위로 문서화합니다."
    ]
  ),
  "Slow Query Tuning": deepDive(
    "Slow Query Tuning은 index를 추가하는 작업으로 시작하면 실패하기 쉽습니다. 먼저 느린 시간이 CPU, I/O, lock, log flush, network fetch, application queue 중 어디에서 발생하는지 분리하고, 실행 계획과 데이터 분포를 확인해야 합니다.",
    [
      "MySQL은 slow query log, Performance Schema digest, EXPLAIN ANALYZE, optimizer trace를 조합합니다. rows_examined가 큰지, lock_time이 큰지, filesort/temp가 병목인지 분리합니다.",
      "PostgreSQL은 pg_stat_statements와 EXPLAIN (ANALYZE, BUFFERS), auto_explain을 사용합니다. temp file, buffer read, row estimation error가 핵심 단서입니다.",
      "Oracle은 AWR top SQL, ASH wait, V$SQL, DBMS_XPLAN DISPLAY_CURSOR를 봅니다. buffer gets와 elapsed time, executions, plan hash 변화를 함께 봅니다."
    ],
    [
      "느린 query 하나만 보고 전체 workload에서 더 큰 top SQL을 놓치는 경우 위험합니다.",
      "index 추가가 write latency, storage, replication lag를 늘리는 비용을 계산하지 않는 경우 위험합니다.",
      "parameter sniffing/bind skew 문제를 단일 bind 값 테스트로 판단하면 위험합니다.",
      "pagination query가 offset 증가에 따라 선형으로 느려지는 구조를 방치하면 위험합니다.",
      "ORM이 생성한 query를 그대로 두고 DB parameter만 바꾸는 경우 효과가 제한적일 수 있습니다."
    ],
    [
      "query digest/queryid/sql_id 기준으로 호출 수, 총 시간, 평균, 분산을 확인합니다.",
      "실행 계획에서 row estimation 오차가 큰 node를 찾습니다.",
      "buffer read와 temp spill을 확인해 I/O인지 memory인지 구분합니다.",
      "lock wait와 CPU 실행 시간을 분리합니다.",
      "문제 query의 입력 parameter 분포와 느린 case를 샘플링합니다."
    ],
    [
      "튜닝 전후를 같은 데이터 분포와 같은 bind 값으로 비교합니다.",
      "index 추가는 중복 index, DML 비용, rollback 절차를 검토한 뒤 적용합니다.",
      "offset pagination, N+1 query, implicit cast, function-wrapped column을 우선 점검합니다.",
      "통계 갱신과 query rewrite를 index보다 먼저 검토할 수 있습니다.",
      "효과 검증은 평균이 아니라 p95/p99, total DB time, resource 사용량으로 판단합니다."
    ]
  )
};

const generalSpecs: GeneralSpec[] = [
  {
    id: "doc-index",
    slug: "concepts/index",
    title: "Index",
    description: "Index는 access path를 줄이는 구조이지만 write amplification, 통계 오차, lock 경합, storage 증가를 동시에 만드는 운영 자산입니다.",
    category: "concept",
    tags: ["Index", "Optimizer", "MySQL", "PostgreSQL", "Oracle"],
    scope: "B-Tree 계열 index, composite index, covering/index only scan, expression/function index, partial/invisible/bitmap index의 운영 판단을 다룹니다.",
    concept: "Index는 table row를 직접 scan하지 않도록 key order와 row locator를 유지하는 자료구조입니다. 효과는 predicate 선택도, 정렬 요구, join 순서, 통계 품질에 의해 결정됩니다.",
    internal: "Index leaf에는 key와 row locator가 저장됩니다. DBMS별 row locator가 다르므로 secondary lookup 비용, visibility 확인 비용, clustering factor가 다르게 나타납니다.",
    comparisonRows: [
      ["row locator", "secondary index leaf에 primary key 저장", "TID가 heap tuple을 가리킴", "ROWID가 data block 위치를 가리킴"],
      ["covering 전략", "secondary index만으로 일부 query 처리", "visibility map 충족 시 index only scan", "index fast full scan 또는 table access by ROWID 회피"],
      ["특수 index", "invisible index, prefix index, functional key part", "partial index, expression index, INCLUDE column", "bitmap index, function-based index, invisible index"]
    ],
    mysql: {
      behavior: "InnoDB는 primary key가 clustered index입니다. secondary index 탐색 후 primary key로 clustered index를 다시 찾을 수 있으므로 primary key 폭과 순서가 전체 index 비용에 영향을 줍니다.",
      settings: ["innodb_stats_persistent", "innodb_stats_persistent_sample_pages", "optimizer_switch", "eq_range_index_dive_limit"],
      diagnosis: ["EXPLAIN ANALYZE에서 access type, rows, filtered를 확인합니다.", "SHOW INDEX로 cardinality와 index column 순서를 확인합니다.", "performance_schema digest에서 rows_examined와 latency를 비교합니다."],
      risks: ["낮은 선택도 column을 선두로 둔 composite index는 효과가 제한됩니다.", "과도한 secondary index는 insert/update/delete 비용을 증가시킵니다.", "긴 varchar primary key는 모든 secondary index 크기를 키웁니다."]
    },
    postgresql: {
      behavior: "PostgreSQL index는 heap tuple TID를 가리키며 MVCC visibility는 heap 또는 visibility map 상태에 따라 확인합니다. INCLUDE column은 index only scan 가능성을 높입니다.",
      settings: ["default_statistics_target", "random_page_cost", "effective_cache_size", "enable_indexscan", "enable_bitmapscan"],
      diagnosis: ["EXPLAIN (ANALYZE, BUFFERS)로 actual rows와 buffer hit/read를 확인합니다.", "pg_stat_user_indexes에서 idx_scan, idx_tup_read, idx_tup_fetch를 봅니다.", "pgstattuple 또는 확장 도구로 bloat를 확인합니다."],
      risks: ["dead tuple이 많으면 index only scan이 heap fetch로 변질됩니다.", "partial index predicate와 query predicate가 맞지 않으면 사용되지 않습니다.", "workload 변화 후 통계가 stale하면 planner가 sequential scan을 선택할 수 있습니다."]
    },
    oracle: {
      behavior: "Oracle B-tree index는 ROWID를 통해 table block에 접근합니다. clustering factor가 높으면 index range scan이 많은 table block I/O를 유발할 수 있습니다.",
      settings: ["optimizer_mode", "optimizer_index_cost_adj", "db_file_multiblock_read_count", "statistics_level"],
      diagnosis: ["DBMS_XPLAN DISPLAY_CURSOR에서 INDEX RANGE SCAN, TABLE ACCESS BY INDEX ROWID를 확인합니다.", "USER_IND_STATISTICS에서 clustering_factor와 num_distinct를 확인합니다.", "V$SQL에서 buffer_gets와 executions를 비교합니다."],
      risks: ["낮은 cardinality column에 B-tree index를 추가하면 이득보다 DML 비용이 커질 수 있습니다.", "bitmap index는 OLTP DML 경합을 유발할 수 있습니다.", "function-based index는 query expression이 일치해야 합니다."]
    },
    judgment: ["predicate 선택도가 충분한지 확인합니다.", "정렬, group by, join key와 index column 순서가 맞는지 확인합니다.", "covering/index only scan이 실제 heap/table access를 줄이는지 확인합니다.", "DML 빈도와 index 유지 비용을 함께 산정합니다.", "통계 수집 주기와 histogram 필요성을 검토합니다.", "replica와 backup에서 index 생성 비용을 고려합니다.", "새 index는 실행 계획 회귀 가능성을 검증한 뒤 반영합니다."],
    issues: ["index 추가 후 write latency가 증가합니다.", "잘못된 composite index 순서로 range scan 범위가 커집니다.", "통계 오차로 full scan과 index scan 선택이 흔들립니다.", "index bloat 또는 leaf page split로 cache 효율이 저하됩니다.", "bitmap/partial/invisible index의 사용 조건을 오해해 운영 query가 계획대로 동작하지 않습니다."],
    checklist: ["query predicate와 index column 순서를 비교합니다.", "actual rows와 estimated rows 차이를 확인합니다.", "buffer read가 줄었는지 확인합니다.", "DML TPS와 redo/WAL 증가량을 확인합니다.", "index size와 cache residency를 확인합니다.", "통계 갱신 후 plan 변화를 확인합니다.", "장애 시 index disable/drop/rebuild 절차를 준비합니다."],
    sql: [commonSql.mysqlDigest, "select schemaname, relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch from pg_stat_user_indexes order by idx_scan desc limit 20;", "select index_name, clustering_factor, num_rows, distinct_keys from user_indexes order by clustering_factor desc fetch first 20 rows only;"],
    references: ["MySQL|MySQL Reference Manual: Optimization and Indexes|https://dev.mysql.com/doc/refman/8.0/en/optimization-indexes.html", "PostgreSQL|PostgreSQL Documentation: Indexes|https://www.postgresql.org/docs/current/indexes.html", "Oracle|Oracle Database Concepts: Indexes|https://docs.oracle.com/en/database/oracle/oracle-database/"],
    deepDive: deepDive(
      "Index 설계는 읽기 query 하나를 빠르게 만드는 작업이 아니라 access path, sort 제거, join 순서 안정화, write amplification, backup/replication 비용을 동시에 조정하는 작업입니다. 인덱스가 선택되지 않는 이유는 DBMS가 인덱스를 모르는 것이 아니라 비용 모델상 더 비싸다고 판단했기 때문일 수 있습니다. 따라서 cardinality, clustering, correlation, visibility, covering 가능성, DML 빈도를 함께 봐야 합니다.",
      [
        "MySQL InnoDB는 primary key가 clustered index라 secondary index leaf에 primary key 값이 들어갑니다. 넓은 primary key는 모든 secondary index를 키우고, secondary lookup은 clustered index 재탐색 비용을 만듭니다.",
        "PostgreSQL은 index가 heap TID를 가리키며 MVCC visibility 때문에 index only scan도 visibility map 상태가 중요합니다. INCLUDE column은 covering에는 유용하지만 predicate 선택도를 높이지 않습니다.",
        "Oracle은 ROWID 기반 table access를 수행하며 clustering factor가 나쁘면 index range scan이 많은 block read를 유발합니다. bitmap index는 분석성 workload에는 유용하지만 OLTP DML에는 위험할 수 있습니다."
      ],
      [
        "낮은 선택도 column을 선두로 둔 composite index를 추가하면 plan 안정성보다 write 비용이 커질 수 있습니다.",
        "기존 index와 left-prefix가 겹치는 index를 계속 추가하면 optimizer 선택지가 늘고 DML 비용이 증가합니다.",
        "함수나 implicit cast가 column에 적용되는 predicate는 일반 index를 사용하지 못할 수 있습니다.",
        "대량 write table에 covering index를 과도하게 추가하면 replica lag와 backup 시간이 증가합니다.",
        "통계가 오래된 상태에서 index 효과를 판단하면 잘못된 access path를 기준으로 의사결정할 수 있습니다."
      ],
      [
        "query별 predicate, join key, order by, group by column을 분리해서 index 후보를 도출합니다.",
        "EXPLAIN에서 index 선택 여부보다 rows examined, buffer read, heap/table fetch 감소를 확인합니다.",
        "index 추가 전후 DML latency와 log volume을 비교합니다.",
        "중복 index와 사용되지 않는 index를 pg_stat_user_indexes, Performance Schema, DBA/USER index view로 확인합니다.",
        "데이터 skew가 큰 column은 histogram 또는 extended statistics 필요성을 확인합니다."
      ],
      [
        "업무 핵심 query set을 기준으로 index를 설계하고 단발성 query 때문에 영구 index를 만들지 않습니다.",
        "새 index는 가능하면 invisible/concurrently/online 옵션으로 운영 영향을 줄입니다.",
        "index naming에는 column 순서와 목적을 드러내고, 제거 후보는 사용량 관측 기간을 둡니다.",
        "covering 목적의 column 추가는 읽기 이득과 write/storage 비용을 수치로 비교합니다.",
        "index 변경은 통계 갱신과 plan 비교를 같은 change set으로 관리합니다."
      ]
    )
  },
  {
    id: "doc-mvcc",
    slug: "concepts/mvcc",
    title: "MVCC",
    description: "MVCC는 read consistency를 제공하지만 version 보관, 정리 지연, 긴 transaction, replication, backup에 운영 비용을 전파합니다.",
    category: "concept",
    tags: ["MVCC", "MySQL", "PostgreSQL", "Oracle"],
    scope: "OLTP transaction에서 consistent read, undo/tuple version, vacuum/purge, snapshot 수명과 장애 패턴을 다룹니다.",
    concept: "MVCC는 transaction이 보는 snapshot과 실제 최신 row를 분리합니다. 독자는 같은 시점의 데이터를 읽지만, DBMS는 과거 version을 보관하고 정리해야 합니다.",
    internal: "version 저장 위치와 visibility 판단 방식이 다릅니다. 긴 transaction은 과거 version 정리를 막아 undo 증가, dead tuple 증가, snapshot too old 같은 장애를 유발합니다.",
    comparisonRows: [
      ["version 저장", "Undo Log", "heap tuple version", "Undo Segment"],
      ["visibility 기준", "Read View", "xmin/xmax와 snapshot", "SCN 기반 consistent read"],
      ["정리 방식", "purge", "vacuum/autovacuum", "undo retention과 space reuse"]
    ],
    mysql: {
      behavior: "InnoDB는 Undo Log와 Read View로 consistent read를 제공합니다. purge thread는 더 이상 필요한 transaction이 없는 undo record를 정리합니다.",
      settings: ["transaction_isolation", "innodb_purge_threads", "innodb_max_purge_lag", "innodb_undo_log_truncate"],
      diagnosis: ["SHOW ENGINE INNODB STATUS에서 history list length를 확인합니다.", "information_schema.innodb_trx에서 장기 transaction을 찾습니다.", "performance_schema로 transaction wait와 statement latency를 확인합니다."],
      risks: ["긴 transaction은 purge 지연과 undo tablespace 증가를 만듭니다.", "Repeatable Read에서 next-key lock과 결합되면 write 경합이 커집니다.", "backup 중 장기 snapshot은 purge pressure를 증가시킬 수 있습니다."]
    },
    postgresql: {
      behavior: "PostgreSQL은 update/delete 시 새 tuple version을 만들고 이전 version은 dead tuple로 남습니다. vacuum이 dead tuple을 정리하고 visibility map을 갱신합니다.",
      settings: ["autovacuum", "autovacuum_vacuum_scale_factor", "autovacuum_vacuum_cost_limit", "old_snapshot_threshold"],
      diagnosis: ["pg_stat_activity에서 xact_start가 오래된 session을 확인합니다.", "pg_stat_user_tables에서 n_dead_tup와 last_autovacuum을 확인합니다.", "age(datfrozenxid)로 wraparound 위험을 봅니다."],
      risks: ["장기 transaction은 vacuum cleanup을 막습니다.", "autovacuum이 따라가지 못하면 bloat와 index scan 비용이 증가합니다.", "replication slot이 오래된 xmin을 유지하면 vacuum 정리가 지연됩니다."]
    },
    oracle: {
      behavior: "Oracle은 Undo Segment와 SCN으로 consistent read를 제공합니다. query가 필요한 undo가 재사용되면 snapshot too old 오류가 발생할 수 있습니다.",
      settings: ["undo_retention", "undo_tablespace", "retention guarantee", "isolation_level"],
      diagnosis: ["V$UNDOSTAT에서 undo 사용량과 tuned_undoretention을 확인합니다.", "V$TRANSACTION으로 active transaction undo 사용량을 봅니다.", "AWR/ASH에서 consistent read 관련 wait를 확인합니다."],
      risks: ["undo retention 부족은 ORA-01555를 유발합니다.", "대량 DML은 undo와 redo를 동시에 증가시킵니다.", "long-running query와 batch DML이 같은 window에 있으면 consistent read 실패 위험이 커집니다."]
    },
    judgment: ["장기 transaction 허용 시간을 정의합니다.", "version 정리 지표를 정기 수집합니다.", "backup과 batch window가 겹치는지 확인합니다.", "replica lag와 snapshot 보존 요구를 함께 봅니다.", "isolation level 변경이 lock 범위에 미치는 영향을 검토합니다.", "undo/WAL/redo 증가량을 capacity planning에 포함합니다.", "정리 작업이 업무 peak를 침범하지 않도록 조정합니다."],
    issues: ["Undo Log 또는 Undo Segment 증가", "PostgreSQL dead tuple과 table bloat 증가", "snapshot too old", "purge 또는 vacuum 지연", "장기 query로 인한 replication apply 지연"],
    checklist: ["가장 오래된 transaction을 찾습니다.", "version 정리 backlog를 확인합니다.", "undo/WAL/redo 증가 추세를 확인합니다.", "autovacuum 또는 purge worker 상태를 확인합니다.", "isolation level과 lock wait를 함께 봅니다.", "backup job의 snapshot 유지 시간을 확인합니다.", "replication slot 또는 replica xmin 보존 상태를 확인합니다."],
    sql: ["select trx_id, trx_started, trx_state, trx_query from information_schema.innodb_trx order by trx_started;", "select pid, xact_start, state, query from pg_stat_activity where xact_start is not null order by xact_start;", "select begin_time, undoblks, txncount, tuned_undoretention from v$undostat order by begin_time desc fetch first 20 rows only;"],
    references: ["MySQL|MySQL Reference Manual: InnoDB Multi-Versioning|https://dev.mysql.com/doc/refman/8.0/en/innodb-multi-versioning.html", "PostgreSQL|PostgreSQL Documentation: MVCC|https://www.postgresql.org/docs/current/mvcc.html", "Oracle|Oracle Database Concepts: Data Concurrency and Consistency|https://docs.oracle.com/en/database/oracle/oracle-database/"],
    deepDive: deepDive(
      "MVCC는 reader와 writer를 분리해 동시성을 높이는 구조이지만 과거 version을 공짜로 보관하지 않습니다. 운영에서 중요한 질문은 어느 transaction이 가장 오래된 snapshot을 붙잡고 있는지, version cleanup worker가 변경량을 따라가고 있는지, long-running query와 backup/replication이 version retention을 늘리고 있는지입니다.",
      [
        "MySQL InnoDB는 Read View와 Undo Log를 사용합니다. purge가 지연되면 history list length가 증가하고 undo tablespace와 buffer pool 압박이 커집니다.",
        "PostgreSQL은 update가 새 tuple을 만들고 이전 tuple은 vacuum 대상이 됩니다. 오래된 xmin이 남아 있으면 dead tuple 정리가 막히고 table/index bloat가 증가합니다.",
        "Oracle은 Undo Segment와 SCN 기반 consistent read를 사용합니다. 필요한 undo가 재사용되면 ORA-01555가 발생할 수 있으므로 undo_retention과 long query 시간을 같이 봐야 합니다."
      ],
      [
        "report query가 몇 시간 동안 transaction을 유지하면서 OLTP write table을 읽는 경우 위험합니다.",
        "backup snapshot과 대량 DML이 같은 시간대에 겹치면 version retention이 급증할 수 있습니다.",
        "PostgreSQL replication slot 또는 standby feedback이 오래된 xmin을 유지하면 vacuum cleanup이 지연됩니다.",
        "MySQL Repeatable Read 장기 transaction은 purge를 막고 undo 증가를 만들 수 있습니다.",
        "Oracle undo tablespace가 부족한 상태에서 long query와 batch update를 함께 실행하면 snapshot too old 위험이 큽니다."
      ],
      [
        "가장 오래된 transaction의 시작 시각, user, application_name, query를 확인합니다.",
        "version cleanup backlog 지표를 시간대별로 보고 batch/backup과 비교합니다.",
        "dead tuple, history list length, undo block 사용량을 데이터 증가율과 함께 봅니다.",
        "replica lag와 version retention 지표가 함께 증가하는지 확인합니다.",
        "장기 transaction 종료 후 cleanup 속도가 정상으로 회복되는지 관측합니다."
      ],
      [
        "transaction은 사용자 대기나 외부 API 호출을 포함하지 않도록 짧게 유지합니다.",
        "report/read-only workload는 가능하면 별도 replica 또는 snapshot 경로로 분리합니다.",
        "batch update는 chunk 단위 commit과 throttle을 사용합니다.",
        "vacuum/purge/undo 지표는 capacity planning의 핵심 지표로 수집합니다.",
        "snapshot 관련 장애는 SQL 튜닝만이 아니라 workload 시간대 조정으로 해결할 수 있습니다."
      ]
    )
  }
];

function deriveSpec(title: string, slug: string, category: DocumentCategory, tags: string[], focus: string): GeneralSpec {
  return {
    id: `doc-${slugId(slug)}`,
    slug,
    title,
    description: `${title} 문서는 ${focus}를 DBMS별 구현 차이와 운영 리스크 기준으로 정리합니다.`,
    category,
    tags: [...tags, "MySQL", "PostgreSQL", "Oracle"],
    scope: `${focus}와 관련된 MySQL, PostgreSQL, Oracle의 동작 방식, 설정, 진단 쿼리, 장애 패턴을 다룹니다. managed service에서는 일부 system view 접근과 parameter 변경 권한이 제한될 수 있습니다.`,
    concept: `${focus}는 단일 기능으로 보지 않고 transaction, optimizer, storage, memory, replication, backup 정책과 함께 판단해야 합니다. 동일한 SQL이라도 DBMS별 내부 구조가 달라 병목 지점과 회피 전략이 달라집니다.`,
    internal: `운영 중에는 ${focus}와 관련된 metadata, 통계, background worker, log/redo/WAL, lock wait, memory pressure를 함께 확인합니다. 진단은 증상 지표, 실행 계획, wait event, 변경 이력 순서로 좁혀야 합니다.`,
    comparisonRows: [
      ["진단 기준", "Performance Schema, sys schema, InnoDB status", "pg_stat views, EXPLAIN BUFFERS, autovacuum 지표", "AWR, ASH, V$ views, DBMS_XPLAN"],
      ["운영 영향", "redo/undo, metadata lock, replication lag", "WAL, bloat, autovacuum, replication slot", "redo/undo, enqueue, archived log, wait event"],
      ["위험 조건", "긴 transaction과 대량 DML", "stale statistics와 vacuum 지연", "undo 부족과 plan regression"]
    ],
    mysql: {
      behavior: `MySQL에서는 ${focus}가 InnoDB storage 구조, optimizer statistics, binary log, metadata lock과 연결됩니다. InnoDB status와 Performance Schema를 함께 확인해야 원인을 분리할 수 있습니다.`,
      settings: ["transaction_isolation", "innodb_buffer_pool_size", "innodb_flush_log_at_trx_commit", "max_connections", "binlog_format"],
      diagnosis: ["Performance Schema statement digest를 확인합니다.", "SHOW ENGINE INNODB STATUS로 lock, transaction, purge 상태를 봅니다.", "EXPLAIN ANALYZE로 실행 계획의 실제 row와 비용을 확인합니다."],
      risks: ["metadata lock 대기로 DDL과 DML이 함께 지연될 수 있습니다.", "redo/undo 증가가 checkpoint와 I/O pressure를 만들 수 있습니다.", "replica 지연 상태에서 읽기 분산 결과가 오래된 데이터가 될 수 있습니다."]
    },
    postgresql: {
      behavior: `PostgreSQL에서는 ${focus}가 MVCC tuple, WAL, planner statistics, autovacuum, process memory와 연결됩니다. pg_stat 계열 view와 EXPLAIN (ANALYZE, BUFFERS)를 함께 봅니다.`,
      settings: ["shared_buffers", "work_mem", "autovacuum", "default_statistics_target", "wal_level"],
      diagnosis: ["pg_stat_activity에서 wait_event와 blocking session을 확인합니다.", "pg_stat_statements로 누적 비용이 큰 SQL을 확인합니다.", "EXPLAIN (ANALYZE, BUFFERS)로 plan과 buffer 사용량을 확인합니다."],
      risks: ["autovacuum 지연은 bloat와 wraparound 위험을 만듭니다.", "work_mem 과대 설정은 동시 실행에서 memory pressure를 유발합니다.", "replication slot 방치는 WAL 증가로 이어질 수 있습니다."]
    },
    oracle: {
      behavior: `Oracle에서는 ${focus}가 optimizer statistics, undo/redo, enqueue/latch, segment 구조와 연결됩니다. AWR/ASH와 V$ view로 wait 중심 분석을 수행합니다.`,
      settings: ["optimizer_mode", "statistics_level", "undo_retention", "sga_target", "pga_aggregate_target"],
      diagnosis: ["V$SESSION에서 wait_class, event, blocking_session을 확인합니다.", "V$SQL에서 elapsed_time, buffer_gets, executions를 확인합니다.", "DBMS_XPLAN DISPLAY_CURSOR로 실제 실행 계획과 predicate를 봅니다."],
      risks: ["undo 부족은 consistent read 실패를 만들 수 있습니다.", "archived redo log 공간 부족은 database 정지를 유발할 수 있습니다.", "통계 변경은 CBO plan regression으로 이어질 수 있습니다."]
    },
    judgment: [`${focus} 변경 전후의 latency, throughput, error rate를 비교합니다.`, "기능 적용 전에 rollback 절차와 점검 SQL을 준비합니다.", "peak 시간대와 batch window가 겹치는지 확인합니다.", "replication lag와 backup window에 미치는 영향을 산정합니다.", "실행 계획의 estimated rows와 actual rows 차이를 확인합니다.", "관련 parameter 변경은 staging에서 workload 기준으로 검증합니다.", "운영 중단 가능성이 있는 lock 범위와 DDL 특성을 확인합니다."],
    issues: [`${focus} 관련 SQL의 p95/p99 latency 증가`, "lock wait 또는 blocking session 증가", "redo/WAL/archive log 증가", "buffer/cache hit ratio 저하와 physical read 증가", "통계 오차로 인한 실행 계획 회귀"],
    checklist: ["최근 배포, DDL, parameter 변경 이력을 확인합니다.", "top SQL과 wait event를 함께 확인합니다.", "실행 계획에서 access path와 join order를 확인합니다.", "lock 대기와 blocking chain을 확인합니다.", "log/redo/WAL 증가량과 disk 여유 공간을 확인합니다.", "replication lag 또는 apply lag를 확인합니다.", "공식문서의 제한 사항과 version별 차이를 확인합니다."],
    sql: [commonSql.mysqlDigest, commonSql.pgActivity, commonSql.oracleSession],
    references: ["MySQL|MySQL Reference Manual|https://dev.mysql.com/doc/refman/8.0/en/", "PostgreSQL|PostgreSQL Documentation|https://www.postgresql.org/docs/current/", "Oracle|Oracle Database Documentation|https://docs.oracle.com/en/database/oracle/oracle-database/"],
    deepDive: derivedDeepDives[title]
  };
}

const derivedSpecs: GeneralSpec[] = [
  deriveSpec("Transaction Isolation", "concepts/transaction-isolation", "concept", ["MVCC", "Lock"], "isolation level, anomaly, consistent read, write conflict"),
  deriveSpec("Lock", "concepts/lock", "concept", ["Lock"], "row lock, table lock, metadata lock, enqueue, blocking chain"),
  deriveSpec("Execution Plan", "concepts/execution-plan", "concept", ["Optimizer"], "실행 계획 해석, access path, join order, estimated rows와 actual rows 비교"),
  deriveSpec("Optimizer Statistics", "concepts/optimizer-statistics", "concept", ["Optimizer"], "통계 수집, histogram, cardinality estimation, plan regression"),
  deriveSpec("Partitioning", "advanced/partitioning", "advanced", ["Partitioning"], "partition pruning, partition maintenance, 대형 테이블 운영"),
  deriveSpec("Replication", "advanced/replication", "advanced", ["Replication"], "replication lag, consistency, failover, log shipping"),
  deriveSpec("Materialized View", "advanced/materialized-view", "advanced", ["Materialized View"], "materialized view refresh, query rewrite, stale data 관리"),
  deriveSpec("Full Text Search", "advanced/full-text-search", "advanced", ["Full Text Search"], "전문 검색 index, tokenizer, ranking, language configuration"),
  deriveSpec("Monitoring / Observability", "advanced/monitoring-observability", "advanced", ["Monitoring"], "wait event, top SQL, lock, I/O, replication lag 관측"),
  deriveSpec("Large Upload", "cases/large-upload", "case", ["Upload"], "대용량 업로드, staging table, bulk load, redo/WAL/undo 증가"),
  deriveSpec("Batch Insert", "cases/batch-insert", "case", ["Upload"], "batch insert, transaction boundary, index maintenance, network round trip"),
  deriveSpec("Read Replica", "cases/read-replica", "case", ["Replication"], "read replica, stale read, lag, read routing"),
  deriveSpec("Large Table Migration", "cases/large-table-migration", "case", ["Migration"], "대형 테이블 migration, backfill, dual write, cutover"),
  deriveSpec("Backup / Recovery", "cases/backup-recovery", "case", ["Backup", "Recovery"], "backup, restore, point-in-time recovery, recovery objective"),
  deriveSpec("Connection Pool Exhaustion", "cases/connection-pool-exhaustion", "case", ["Monitoring"], "connection pool exhaustion, session leak, max connection, queueing"),
  deriveSpec("Deadlock Analysis", "cases/deadlock-analysis", "case", ["Deadlock", "Lock"], "deadlock graph, lock order, transaction retry, blocking analysis"),
  deriveSpec("Slow Query Tuning", "cases/slow-query-tuning", "case", ["Slow Query", "Optimizer"], "slow query tuning, plan regression, index, statistics, wait analysis")
];

const jsonJsonbDocument: WikiDocument = {
  id: "doc-advanced-json-jsonb",
  slug: "advanced/json-jsonb",
  title: "JSON / JSONB",
  description: "JSON 저장은 schema 유연성을 제공하지만 무결성, 인덱싱, 집계, 복제, 부분 업데이트 비용을 운영 리스크로 만듭니다.",
  category: "advanced",
  level: "reference",
  status: "published",
  published_at: now,
  created_at: now,
  updated_at: now,
  deleted_at: null,
  tags: tagsFor(["JSON", "MySQL", "PostgreSQL", "Oracle"]),
  official_docs: officialDocs("doc-advanced-json-jsonb", [
    "MySQL|MySQL Reference Manual: The JSON Data Type|https://dev.mysql.com/doc/refman/8.0/en/json.html",
    "PostgreSQL|PostgreSQL Documentation: JSON Types|https://www.postgresql.org/docs/current/datatype-json.html",
    "Oracle|Oracle Database JSON Developer's Guide|https://docs.oracle.com/en/database/oracle/oracle-database/"
  ]),
  content: `# JSON / JSONB

## 한 줄 결론

JSON 컬럼은 RDBMS 안에서 가변 구조 데이터를 다루기 위한 도구입니다. 다만 JSON을 정규 컬럼의 대체재로 쓰면 무결성, 인덱싱, 집계, 복제, 부분 업데이트 비용이 운영 리스크로 돌아옵니다.

## Tags

\`JSON\` \`MySQL\` \`PostgreSQL\` \`Oracle\`

## 적용 범위

이 문서는 MySQL JSON, PostgreSQL json/jsonb, Oracle SQL/JSON 기능을 기준으로 JSON 컬럼의 설계 기준과 운영 리스크를 다룹니다. Document DB 전체를 다루는 문서가 아니며, RDBMS 테이블 안에 JSON 또는 JSONB 컬럼을 둘 때의 판단 기준을 설명합니다.

## 왜 RDBMS에서 JSON을 쓰는가

서비스가 커지면 테이블 구조가 계속 바뀝니다. 주문에는 포장 옵션이 붙고, 상품에는 카테고리별 속성이 붙고, 외부 API 응답에는 우리가 통제하지 못하는 필드가 추가됩니다. 모든 변경을 ALTER TABLE로 처리하면 대형 테이블에서는 metadata lock, table rewrite, replication lag, migration window 문제가 발생합니다.

JSON 컬럼은 이 문제에 대한 타협입니다. 핵심 식별자와 조회 조건은 정규 컬럼으로 유지하고, 구조가 자주 바뀌거나 업무 핵심이 아닌 부가 속성은 JSON에 보관합니다. 이 방식은 유연하지만 책임의 위치가 DB 제약조건에서 application validation과 운영 규칙으로 이동합니다.

## DBMS별 지원 개요

| 관점 | MySQL | PostgreSQL | Oracle |
|---|---|---|---|
| 저장 타입 | JSON 타입, binary JSON 포맷 | json, jsonb 타입 | JSON data type 또는 JSON constraint 기반 저장 |
| 대표 연산 | JSON_EXTRACT, JSON_SET, JSON_TABLE | ->, ->>, @>, ?, jsonb_set | JSON_VALUE, JSON_QUERY, JSON_TABLE |
| 인덱싱 | generated column 또는 functional index | GIN, expression index, jsonb_path_ops | search index, function-based index |
| 부분 업데이트 | JSON_SET 사용 가능, 실제 write amplification 확인 필요 | jsonb_set은 새 jsonb value 생성 | JSON_TRANSFORM 등 version별 기능 확인 |
| 주요 리스크 | generated column 관리, binlog 증가 | GIN index 크기, jsonb update 비용 | JSON search index 비용, optimizer 통계 관리 |

## 장점 1: 스키마 유연성

JSON의 가장 큰 장점은 DDL 없이 필드를 추가할 수 있다는 점입니다. 상품 속성이 카테고리마다 다를 때 모든 속성을 정규 컬럼으로 만들면 sparse column이 늘어나거나 EAV 모델이 됩니다. EAV는 유연하지만 join과 type validation이 복잡해집니다.

예를 들어 의류에는 color, size, material이 필요하고 식품에는 expiry_date, allergen, storage_temperature가 필요할 수 있습니다. 이 속성이 검색 조건이나 정산 기준이 아니라 상세 표시용이라면 JSON 컬럼이 실용적입니다. 반대로 가격, 재고, 판매 상태처럼 업무 핵심 필드는 JSON에 넣으면 안 됩니다.

## 장점 2: 반정규화 조회

주문 상세 화면에서 주문 시점의 배송지, 쿠폰, 결제 수단, 가게명, 메뉴 옵션 snapshot을 그대로 보여줘야 하는 경우가 있습니다. 이때 현재 master table을 join하면 주문 당시 상태와 다른 값을 보여줄 수 있습니다.

JSON snapshot은 이런 조회에 유용합니다. 주문 생성 시점의 상태를 payload로 저장하고, 상세 조회에서는 JSON을 한 번 읽어 응답을 구성합니다. 이 패턴은 읽기 비율이 높고 snapshot을 자주 수정하지 않는 경우에 적합합니다. 다만 snapshot 내부 값을 조건 검색하거나 집계하기 시작하면 정규 컬럼 승격을 검토해야 합니다.

## 장점 3: 외부 시스템 원본 보관

PG 승인 응답, 택배사 tracking 응답, 소셜 로그인 profile, webhook payload는 외부 시스템이 schema를 통제합니다. 필드가 추가되거나 nested 구조가 바뀌어도 원본을 보관해야 감사와 장애 분석이 가능합니다.

이 경우 원본 JSON은 별도 payload 컬럼에 저장하고, 업무에서 자주 쓰는 값만 별도 컬럼으로 추출하는 하이브리드 패턴이 안정적입니다. 예를 들어 payment_status, pg_transaction_id, approved_at은 정규 컬럼으로 두고, 전체 PG response는 JSON으로 보관합니다.

## 장점 4: 이벤트와 로그성 데이터

감사 로그, 사용자 활동 로그, 설정 변경 이력은 이벤트 종류마다 payload 구조가 다릅니다. login 이벤트는 ip, device, browser가 필요하고 payment 이벤트는 amount, method, pg_tid가 필요합니다.

이벤트별 table을 모두 만들면 schema 수가 늘어나고 조회 코드가 복잡해집니다. 이벤트 공통 필드인 event_type, actor_id, occurred_at, aggregate_id는 정규 컬럼으로 두고, 이벤트별 부가 정보는 JSON payload로 두는 방식이 관리하기 쉽습니다.

## 장점 5: 실험과 프로토타이핑

신규 기능에서 속성 구조가 확정되지 않았을 때 JSON은 초기 구현 속도를 높입니다. 하지만 프로토타이핑 목적으로 넣은 JSON 필드가 몇 달 뒤 핵심 검색 조건이 되는 순간 운영 부채가 됩니다.

따라서 JSON으로 시작하더라도 정규 컬럼 승격 기준을 미리 정해야 합니다. 그 키로 검색하는 query가 생겼는지, NOT NULL이 필요한지, 집계 대상이 되었는지, 값이 자주 업데이트되는지를 기준으로 승격 시점을 판단합니다.

## 단점 1: 데이터 무결성 약화

정규 컬럼은 NOT NULL, UNIQUE, FOREIGN KEY, CHECK constraint로 데이터 품질을 DB에서 강제할 수 있습니다. JSON 내부 값은 대체로 application validation에 의존합니다.

price가 문자열로 들어오거나 필수 key가 빠져도 DB가 자동으로 막아주지 않을 수 있습니다. DBMS별로 JSON schema validation 또는 check constraint를 사용할 수 있지만, 성능 비용과 운영 복잡도가 있습니다. 중요한 업무 규칙은 JSON 내부가 아니라 정규 컬럼과 제약조건으로 표현하는 편이 안전합니다.

## 단점 2: 쿼리 성능과 인덱싱 비용

JSON 내부 key를 WHERE 조건에 사용하면 기본적으로 함수를 적용한 검색이 됩니다. 정규 컬럼의 B-tree lookup과 다르게 expression extraction, cast, path evaluation 비용이 추가됩니다.

${comparisonSqlBlock([
  "select *\nfrom orders\nwhere json_unquote(json_extract(options, '$.delivery_type')) = 'express';",
  "select *\nfrom orders\nwhere options->>'delivery_type' = 'express';",
  "select *\nfrom orders\nwhere json_value(options, '$.delivery_type') = 'express';"
])}

MySQL은 generated column 또는 functional index를 사용해야 합니다. PostgreSQL은 containment query에는 GIN index가 유용하지만, options->>'delivery_type' = 'express' 같은 equality 조건에는 expression index가 더 직접적일 수 있습니다. Oracle은 JSON search index 또는 function-based index를 검토합니다.

## 단점 3: JOIN과 집계가 어려워짐

JSON 내부 값을 join key나 group by 대상으로 사용하면 query가 복잡해지고 optimizer가 cardinality를 추정하기 어려워집니다. 분석팀이나 운영자가 ad-hoc query를 작성할 때도 JSON path와 type cast를 매번 처리해야 합니다.

${comparisonSqlBlock([
  "select json_unquote(json_extract(payload, '$.category')) as category,\n       count(*) as event_count\nfrom events\ngroup by json_unquote(json_extract(payload, '$.category'));",
  "select payload->>'category' as category,\n       count(*) as event_count\nfrom events\ngroup by payload->>'category';",
  "select json_value(payload, '$.category') as category,\n       count(*) as event_count\nfrom events\ngroup by json_value(payload, '$.category');"
])}

집계 대상이 되는 값은 JSON에 남겨두기보다 정규 컬럼으로 승격하는 것이 일반적으로 낫습니다. 집계는 반복 실행되고 데이터가 커질수록 비용이 누적되기 때문입니다.

## 단점 4: 스키마 파악과 변경 이력 추적이 어려움

DDL을 보면 정규 컬럼의 이름과 타입은 바로 알 수 있습니다. JSON 컬럼은 내부 key 목록, 타입, optional 여부, version별 구조를 데이터에서 역추적해야 합니다.

같은 컬럼 안에 v1은 address 문자열, v2는 address object를 넣는 식으로 변화하면 읽는 코드는 양쪽을 모두 처리해야 합니다. 이 문제를 줄이려면 schema_version, key naming convention, 최대 depth, 최대 size, deprecation policy를 문서화해야 합니다.

## 단점 5: 저장 공간과 복제 부하

JSON은 key 이름이 row마다 반복됩니다. delivery_type 같은 문자열이 수백만 row에 반복 저장됩니다. 또한 row based replication이나 WAL/redo 기록에서는 JSON 값 변경이 큰 log volume을 만들 수 있습니다.

작은 key 하나를 수정했는데 내부적으로 전체 JSON value가 다시 쓰이면 undo, redo, WAL, binlog, archive log, replica apply 비용이 증가합니다. JSON이 커질수록 update와 replication lag 위험이 커집니다.

## 단점 6: 부분 업데이트 비용

MySQL의 JSON_SET, PostgreSQL의 jsonb_set, Oracle의 JSON_TRANSFORM 같은 기능은 path 단위 update API를 제공합니다. 하지만 운영자가 확인해야 할 것은 문법이 아니라 실제 write amplification입니다.

PostgreSQL jsonb는 immutable value에 가깝기 때문에 일부 key 변경도 새 tuple version과 WAL 증가로 이어집니다. MySQL도 부분 update 최적화 여부는 version, storage layout, 변경 크기에 따라 다릅니다. 자주 바뀌는 값은 JSON에 두지 않는 편이 안전합니다.

## JSON을 써도 되는 조건

- 읽기 위주 데이터입니다.
- 자주 업데이트하지 않습니다.
- WHERE 조건으로 거의 검색하지 않습니다.
- JOIN key나 집계 대상이 아닙니다.
- 구조가 가변적이거나 외부 시스템이 schema를 통제합니다.
- 원본 보관 또는 감사 목적이 중요합니다.
- 핵심 업무 무결성을 DB 제약조건으로 강제할 필요가 낮습니다.

## JSON을 피해야 하는 조건

- 해당 값으로 자주 필터링합니다.
- 해당 값이 다른 table과 join됩니다.
- NOT NULL, UNIQUE, FOREIGN KEY가 필요합니다.
- 금액, 상태, 식별자처럼 업무 핵심 값입니다.
- SUM, COUNT, AVG 같은 집계 대상입니다.
- 값이 자주 업데이트됩니다.
- API 응답 편의를 위해 임의로 넣었지만 운영 query가 계속 늘고 있습니다.

## 하이브리드 설계 패턴

가장 안정적인 패턴은 자주 쓰는 필드는 정규 컬럼으로 두고, 가변 속성만 JSON으로 두는 방식입니다.

${comparisonSqlBlock([
  "create table products (\n  id bigint primary key,\n  name varchar(200) not null,\n  price decimal(10, 2) not null,\n  category varchar(50) not null,\n  attributes json,\n  created_at timestamp not null\n);",
  "create table products (\n  id bigserial primary key,\n  name varchar(200) not null,\n  price numeric(10, 2) not null,\n  category varchar(50) not null,\n  attributes jsonb,\n  created_at timestamptz not null\n);",
  "create table products (\n  id number generated by default as identity primary key,\n  name varchar2(200) not null,\n  price number(10, 2) not null,\n  category varchar2(50) not null,\n  attributes json,\n  created_at timestamp not null\n);"
])}

검색은 category, price, status 같은 정규 컬럼으로 수행하고, 상세 화면에서만 attributes를 읽습니다. JSON 내부 key가 검색 조건으로 승격되면 generated column, expression index, 정규 컬럼 분리를 검토합니다.

## JSON 구조 규칙

- key naming은 snake_case 또는 팀 표준으로 고정합니다.
- schema_version 필드를 둡니다.
- 최대 depth를 2~3단계로 제한합니다.
- 최대 크기를 정합니다.
- 배열에는 무제한 item을 넣지 않습니다.
- 날짜/금액/식별자는 문자열 표현 규칙을 정합니다.
- 사라지는 key는 deprecation 기간을 둡니다.

## MySQL

### 동작 방식

MySQL은 JSON 타입을 binary JSON 형식으로 저장하고 JSON_EXTRACT, JSON_SET, JSON_TABLE 같은 함수를 제공합니다. JSON path expression을 WHERE에서 직접 사용하면 일반 B-tree index를 바로 활용하기 어렵습니다.

### 관련 설정

- max_allowed_packet
- binlog_row_image
- generated column과 functional index 정책
- innodb_log_file_size
- innodb_flush_log_at_trx_commit

### 진단 방법

- Performance Schema digest에서 JSON_EXTRACT가 포함된 query의 rows examined를 확인합니다.
- EXPLAIN ANALYZE에서 generated column index를 사용하는지 확인합니다.
- binlog 증가량과 replica lag를 JSON update 시점과 맞춰 봅니다.

### 운영 주의점

- JSON 내부 key로 검색한다면 generated column 또는 functional index를 설계합니다.
- 큰 JSON을 자주 update하면 undo/redo와 binlog 부하가 증가합니다.
- JSON_TABLE은 편리하지만 대량 row에 적용하면 CPU 비용이 커질 수 있습니다.

## PostgreSQL

### 동작 방식

PostgreSQL json은 입력 text를 보존하고 jsonb는 binary representation으로 저장합니다. jsonb는 key order와 duplicate key 처리 방식이 json과 다르며, GIN index를 통한 containment query에 강점이 있습니다.

### 관련 설정

- default_statistics_target
- gin_pending_list_limit
- maintenance_work_mem
- work_mem
- autovacuum_vacuum_scale_factor
- wal_compression

### 진단 방법

- EXPLAIN (ANALYZE, BUFFERS)에서 GIN index 사용 여부와 recheck 비용을 확인합니다.
- pg_stat_user_indexes에서 idx_scan과 idx_tup_read를 확인합니다.
- pg_stat_statements에서 jsonb 연산 query의 평균과 p95에 가까운 분포를 확인합니다.

### 운영 주의점

- jsonb update는 새 tuple version과 WAL 증가를 만들 수 있습니다.
- GIN index는 read에는 유리하지만 write 비용과 index size가 큽니다.
- options->>'key' equality query에는 GIN보다 expression index가 적합할 수 있습니다.

## Oracle

### 동작 방식

Oracle은 SQL/JSON 함수와 JSON_TABLE, JSON_VALUE, JSON_QUERY, JSON_EXISTS를 제공합니다. version에 따라 JSON type, binary JSON, search index 지원 범위가 다르므로 대상 version의 공식문서를 확인해야 합니다.

### 관련 설정

- optimizer statistics
- JSON search index 정책
- PGA/temporary tablespace
- redo log sizing
- undo_retention

### 진단 방법

- DBMS_XPLAN에서 JSON_VALUE 또는 JSON_TABLE 사용 query의 access path를 확인합니다.
- V$SQL에서 buffer_gets, elapsed_time, executions를 비교합니다.
- AWR에서 JSON 관련 query가 top SQL로 올라오는지 확인합니다.

### 운영 주의점

- JSON_TABLE은 relational projection에 유용하지만 대량 처리에서 CPU와 temp 사용량이 커질 수 있습니다.
- search index는 query 성능을 높이지만 DML 비용과 storage를 증가시킵니다.
- JSON 내부 값을 핵심 업무 제약조건 대신 사용하면 데이터 품질 관리가 어려워집니다.

## 인덱싱 전략

JSON을 WHERE 조건에 사용해야 한다면 인덱스를 설계해야 합니다. DBMS별로 권장 방식이 다릅니다.

${comparisonSqlBlock([
  "alter table orders\nadd delivery_type varchar(20)\n  generated always as (json_unquote(json_extract(options, '$.delivery_type'))) virtual,\nadd index idx_orders_delivery_type (delivery_type);",
  "create index idx_orders_options_gin\non orders using gin (options jsonb_path_ops);",
  "create search index idx_orders_options_json\non orders (options)\nfor json;"
])}

인덱스는 query를 빠르게 만들지만 write path를 느리게 합니다. JSON index는 특히 크기가 커질 수 있으므로 index scan 횟수, index size, write latency, vacuum/purge 비용을 함께 봐야 합니다.

## 크기 제한

JSON 컬럼은 크기 제한이 없다고 생각하기 쉽지만 운영에서는 반드시 상한을 둬야 합니다. 작은 JSON은 편의성이 크지만, 수백 KB 이상의 JSON이 row에 들어가기 시작하면 backup, replication, cache, update 비용이 눈에 띄게 증가합니다.

권장 기준은 업무마다 다르지만, 일반 속성 데이터는 10KB 이하, 이벤트 payload는 64KB 이하, 외부 원본 보관은 별도 table과 retention 정책을 두는 편이 안전합니다.

## 정규 컬럼 승격 기준

다음 조건 중 하나가 발생하면 JSON 내부 key를 정규 컬럼으로 빼는 것을 검토합니다.

- 해당 key로 검색하는 query가 생겼습니다.
- 해당 key에 NOT NULL 또는 UNIQUE가 필요합니다.
- 해당 key가 join key가 되었습니다.
- 해당 key가 리포팅이나 집계 대상이 되었습니다.
- 해당 key가 자주 update됩니다.
- 해당 key를 기준으로 장애 분석이나 운영 대응이 반복됩니다.

## 마이그레이션 절차

JSON key를 정규 컬럼으로 승격할 때는 한 번에 제거하지 않습니다.

- 정규 컬럼을 NULL 허용으로 추가합니다.
- JSON에서 값을 추출해 backfill합니다.
- application read path를 정규 컬럼 우선으로 바꿉니다.
- write path를 정규 컬럼과 JSON dual-write로 운영합니다.
- 검증 기간 후 JSON 내부 key 제거 여부를 결정합니다.
- rollback이 필요하면 JSON 원본을 기준으로 정규 컬럼을 재생성할 수 있게 합니다.

## 장애/성능 이슈 패턴

- JSON path 조건 query가 full scan으로 실행되어 latency가 증가합니다.
- GIN index 또는 generated column index 추가 후 write latency가 증가합니다.
- JSON update가 WAL/binlog/redo 증가를 만들고 replica lag가 누적됩니다.
- JSON 구조 version이 섞여 application parser error가 증가합니다.
- JSON 내부 값을 집계하면서 temporary file 또는 sort/hash spill이 증가합니다.
- 큰 JSON payload가 cache 효율을 낮추고 backup 시간이 증가합니다.
- 외부 API 원본 보관 table에 retention이 없어 storage가 빠르게 증가합니다.

## 진단 체크리스트

- JSON 내부 key가 WHERE, JOIN, GROUP BY, ORDER BY에 사용되는지 확인합니다.
- JSON query의 실행 계획과 rows examined 또는 buffer 사용량을 확인합니다.
- JSON index의 크기와 실제 사용 횟수를 확인합니다.
- JSON update 시점과 WAL/binlog/redo 증가량을 맞춰 봅니다.
- replica lag가 JSON update batch와 연동되는지 확인합니다.
- payload 평균 크기와 p95 크기를 측정합니다.
- schema_version 분포를 확인합니다.
- application validation 실패율과 DB 저장 실패율을 비교합니다.
- 정규 컬럼 승격이 필요한 key 목록을 정리합니다.

## 실무 판단 기준

- 핵심 업무 값이면 JSON이 아니라 정규 컬럼으로 둡니다.
- 부가 속성이며 상세 조회에서만 쓰이면 JSON을 허용할 수 있습니다.
- 검색 조건으로 등장하는 순간 인덱싱 또는 정규 컬럼 승격을 검토합니다.
- 집계 대상이 되는 순간 JSON 유지 비용이 커집니다.
- 자주 update되는 값은 JSON에 두지 않습니다.
- 외부 원본 payload는 보관 목적과 retention을 명확히 합니다.
- JSON 구조 변경은 schema_version과 migration plan을 함께 둡니다.
- JSON 크기 p95가 증가하면 storage와 replication 비용을 재산정합니다.
- managed service에서는 JSON index와 generated column 지원 범위를 확인합니다.

## 예시 SQL

${comparisonSqlBlock([
  "select table_schema, table_name, column_name\nfrom information_schema.columns\nwhere data_type = 'json';",
  "select query, calls, mean_exec_time, rows\nfrom pg_stat_statements\nwhere query ilike '%jsonb%' or query ilike '%->>%'\norder by total_exec_time desc\nlimit 20;",
  "select sql_id, executions, elapsed_time, buffer_gets, sql_text\nfrom v$sql\nwhere lower(sql_text) like '%json_value%'\n   or lower(sql_text) like '%json_table%'\norder by elapsed_time desc\nfetch first 20 rows only;"
])}

## 공식문서 참고

- MySQL: [The JSON Data Type](https://dev.mysql.com/doc/refman/8.0/en/json.html)
- MySQL: [Generated Columns](https://dev.mysql.com/doc/refman/8.0/en/create-table-generated-columns.html)
- PostgreSQL: [JSON Types](https://www.postgresql.org/docs/current/datatype-json.html)
- PostgreSQL: [GIN Indexes](https://www.postgresql.org/docs/current/gin.html)
- Oracle: [JSON Developer's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/)
`
};

export const referenceDocuments: WikiDocument[] = [
  renderArchitecture("MySQL"),
  renderArchitecture("PostgreSQL"),
  renderArchitecture("Oracle"),
  ...generalSpecs.map((spec) => ({
    id: spec.id,
    slug: spec.slug,
    title: spec.title,
    description: spec.description,
    category: spec.category,
    level: "reference",
    status: "published" as const,
    published_at: now,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    tags: tagsFor(spec.tags),
    official_docs: officialDocs(spec.id, spec.references),
    content: renderGeneral(spec)
  })),
  jsonJsonbDocument,
  ...derivedSpecs.map((spec) => ({
    id: spec.id,
    slug: spec.slug,
    title: spec.title,
    description: spec.description,
    category: spec.category,
    level: "reference",
    status: "published" as const,
    published_at: now,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    tags: tagsFor(spec.tags),
    official_docs: officialDocs(spec.id, spec.references),
    content: renderGeneral(spec)
  }))
];
