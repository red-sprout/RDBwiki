create or replace function public.build_reference_depth_appendix(
  p_title text,
  p_focus text,
  p_mysql text,
  p_postgresql text,
  p_oracle text,
  p_risk text
)
returns text
language sql
stable
as $$
select format($doc$

<!-- reference-depth-v2 -->

## 운영 모델 상세

%1$s 문서는 %2$s를 기능 설명이 아니라 운영 판단 단위로 다룹니다. 핵심은 기능을 켜는 방법이 아니라 workload, transaction 경계, 실행 계획, lock 범위, log volume, replication lag, recovery 절차가 함께 어떻게 변하는지 확인하는 것입니다. 같은 기능이라도 OLTP, batch, analytics, read replica, backup window에서는 위험 지점이 달라집니다.

### DBMS별 세부 확인 포인트

- MySQL: %3$s
- PostgreSQL: %4$s
- Oracle: %5$s

### 사용하면 위험한 조건

- %6$s
- production 데이터 분포와 다른 staging 결과만 보고 변경하는 경우 위험합니다.
- p95/p99 latency, lock wait, log 증가량, replica lag를 측정하지 않고 평균 latency만 보는 경우 위험합니다.
- rollback 절차 없이 schema/index/parameter 변경을 동시에 적용하는 경우 위험합니다.
- application retry가 DB timeout과 맞물려 같은 SQL을 중복 실행하는 경우 위험합니다.
- backup, replication, CDC, monitoring pipeline의 부작용을 확인하지 않는 경우 위험합니다.

### 추가 진단 절차

- 장애 시작 시각과 배포, DDL, batch, backup, 통계 수집 이벤트를 같은 timeline에 놓습니다.
- top SQL과 top wait event를 함께 보고 CPU 실행, lock wait, I/O wait, log flush wait를 분리합니다.
- 실행 계획에서 estimated rows와 actual rows 차이가 큰 node를 찾습니다.
- primary와 replica의 지표를 분리해 lag, stale read, apply 지연을 확인합니다.
- 변경 전후 rows examined, buffer read, temporary file, undo/WAL/redo/binlog 증가량을 비교합니다.
- blocker transaction이 있으면 피해 SQL보다 blocker의 transaction 시작 시각과 마지막 SQL을 먼저 확인합니다.
- 완화 조치 후 다음 peak window까지 같은 증상이 재발하는지 관측합니다.

### 운영 규칙

- 변경은 단일 변수로 나누고, 각 변경마다 기대 지표와 rollback 기준을 기록합니다.
- index, parameter, query rewrite는 읽기 성능뿐 아니라 write path, backup size, restore time, replication lag를 함께 계산합니다.
- 운영 문서에는 정상 사용 조건보다 위험 조건과 중단 기준을 더 명확히 적습니다.
- 공식문서의 version별 제한, managed service 제약, 권한 제한을 확인한 뒤 절차에 반영합니다.
- 사후 기록은 증상, 원인, 확인 SQL, 실행 계획, 지표 변화, 재발 방지 조치로 남깁니다.
$doc$, p_title, p_focus, p_mysql, p_postgresql, p_oracle, p_risk);
$$;

with appendices(slug, appendix) as (
  values
    ('dbms/mysql/architecture', public.build_reference_depth_appendix(
      'MySQL Architecture',
      'SQL layer, InnoDB storage engine, thread, buffer pool, redo/undo, binary log, replication 경로',
      'InnoDB buffer pool, history list length, metadata lock, redo flush, purge thread, binary log durability를 함께 확인합니다.',
      '비교 기준으로 process-per-connection, WAL, autovacuum, visibility map 차이를 확인합니다.',
      '비교 기준으로 SGA/PGA, undo segment, redo, enqueue, AWR wait model 차이를 확인합니다.',
      'connection 수를 늘리거나 buffer pool만 키워 SQL/lock/log 병목을 가리는 경우'
    )),
    ('dbms/postgresql/architecture', public.build_reference_depth_appendix(
      'PostgreSQL Architecture',
      'backend process, shared buffers, WAL, heap tuple MVCC, autovacuum, replication slot 경로',
      '비교 기준으로 InnoDB clustered index, undo/purge, metadata lock 차이를 확인합니다.',
      'pg_stat_activity, pg_stat_statements, pg_locks, pg_stat_user_tables, pg_stat_replication을 연결해서 확인합니다.',
      '비교 기준으로 Oracle SGA/PGA, undo retention, DBMS_XPLAN, AWR/ASH 차이를 확인합니다.',
      'autovacuum 지연, replication slot 방치, work_mem 과대 설정을 별도 경보 없이 운영하는 경우'
    )),
    ('dbms/oracle/architecture', public.build_reference_depth_appendix(
      'Oracle Architecture',
      'SGA/PGA, server process, undo/redo, datafile/control file, wait event, RMAN/Data Guard 경로',
      '비교 기준으로 InnoDB buffer pool, redo/binlog, Performance Schema 차이를 확인합니다.',
      '비교 기준으로 PostgreSQL WAL, autovacuum, process memory, pg_stat views 차이를 확인합니다.',
      'V$SESSION, V$SQL, DBMS_XPLAN, AWR, ASH, V$UNDOSTAT를 SQL_ID와 wait 기준으로 연결합니다.',
      'undo/FRA/archive log 공간과 plan regression을 별도 capacity 계획 없이 운영하는 경우'
    )),
    ('concepts/index', public.build_reference_depth_appendix(
      'Index',
      'access path, row locator, composite key order, covering scan, write amplification',
      'clustered primary key와 secondary index leaf의 primary key 저장 비용을 확인합니다.',
      'heap TID, visibility map, index only scan, partial/expression/INCLUDE index 조건을 확인합니다.',
      'ROWID, clustering factor, bitmap/function-based/invisible index의 OLTP 영향을 확인합니다.',
      '낮은 선택도 column을 선두로 둔 composite index를 추가하거나 중복 index를 계속 만드는 경우'
    )),
    ('concepts/mvcc', public.build_reference_depth_appendix(
      'MVCC',
      'snapshot visibility, undo 또는 tuple version 보관, purge/vacuum/undo retention',
      'Read View, Undo Log, purge thread, history list length를 확인합니다.',
      'xmin/xmax, dead tuple, autovacuum, replication slot xmin, visibility map을 확인합니다.',
      'SCN, Undo Segment, undo_retention, ORA-01555 가능성을 확인합니다.',
      '긴 report transaction과 batch DML, backup snapshot을 같은 시간대에 실행하는 경우'
    )),
    ('concepts/transaction-isolation', public.build_reference_depth_appendix(
      'Transaction Isolation',
      'isolation level, anomaly 허용 범위, locking read, serialization retry',
      'Repeatable Read에서 consistent read와 locking read, gap/next-key lock 차이를 확인합니다.',
      'Read Committed snapshot 변화, Repeatable Read snapshot, Serializable SSI 충돌을 확인합니다.',
      'statement-level consistent read, Serializable 충돌, undo retention 영향을 확인합니다.',
      'application retry 없이 Serializable을 적용하거나 isolation level로 idempotency 부재를 숨기는 경우'
    )),
    ('concepts/lock', public.build_reference_depth_appendix(
      'Lock',
      'row lock, table lock, metadata/schema lock, enqueue, blocking chain',
      'InnoDB row/gap/next-key lock과 metadata lock queue를 확인합니다.',
      'pg_locks, pg_blocking_pids, idle in transaction, relation lock을 확인합니다.',
      'enqueue, latch, library cache lock, blocking_session, ASH wait chain을 확인합니다.',
      'DDL, batch UPDATE, 외래키 index 누락, 서로 다른 lock 순서가 같은 peak에 겹치는 경우'
    )),
    ('concepts/execution-plan', public.build_reference_depth_appendix(
      'Execution Plan',
      'access path, join order, estimated rows와 actual rows, buffer/temp 사용량',
      'EXPLAIN ANALYZE의 rows, filtered, key, Using temporary/filesort를 확인합니다.',
      'EXPLAIN (ANALYZE, BUFFERS)의 actual rows, loops, shared read, temp spill을 확인합니다.',
      'DBMS_XPLAN ALLSTATS LAST, predicate information, plan hash, child cursor를 확인합니다.',
      'plan text만 보고 full scan이나 nested loop를 무조건 장애로 판단하는 경우'
    )),
    ('concepts/optimizer-statistics', public.build_reference_depth_appendix(
      'Optimizer Statistics',
      'cardinality estimation, histogram, extended statistics, plan regression',
      'persistent statistics, histogram, sample page, index cardinality를 확인합니다.',
      'pg_statistic, default_statistics_target, extended statistics, analyze 시각을 확인합니다.',
      'object/system statistics, histogram, dynamic sampling, SQL plan management를 확인합니다.',
      '대량 적재 직후 통계 갱신 없이 운영 query를 실행하거나 통계 수집을 change event로 기록하지 않는 경우'
    )),
    ('advanced/partitioning', public.build_reference_depth_appendix(
      'Partitioning',
      'partition pruning, retention, partition maintenance, global/local index',
      'partition key와 unique key 제약, ALTER PARTITION의 metadata lock을 확인합니다.',
      'declarative partitioning, partition pruning, attach/detach, autovacuum 분산을 확인합니다.',
      'range/list/hash/composite partition, local/global index, partition exchange를 확인합니다.',
      'partition key가 query predicate와 맞지 않아 pruning이 실패하는 경우'
    )),
    ('advanced/replication', public.build_reference_depth_appendix(
      'Replication',
      'log shipping, apply lag, consistency, read routing, failover',
      'binary log, GTID, relay log, replica worker, Seconds_Behind_Source 한계를 확인합니다.',
      'WAL sender/receiver, replay lag, replication slot, hot standby conflict를 확인합니다.',
      'Data Guard redo transport, apply lag, protection mode, broker 상태를 확인합니다.',
      'read-after-write 요청을 lag 있는 replica로 보내거나 failover 후 old primary 격리가 없는 경우'
    )),
    ('advanced/materialized-view', public.build_reference_depth_appendix(
      'Materialized View',
      'precomputed result, refresh strategy, stale data, query rewrite',
      'summary table과 scheduler 기반 refresh의 transaction 경계를 확인합니다.',
      'REFRESH MATERIALIZED VIEW, CONCURRENTLY, unique index 요구, stale window를 확인합니다.',
      'materialized view log, fast/complete refresh, query rewrite, staleness를 확인합니다.',
      'refresh 시간이 변경 주기보다 길거나 stale data 허용 범위를 업무와 합의하지 않은 경우'
    )),
    ('advanced/json-jsonb', ''),
    ('advanced/full-text-search', public.build_reference_depth_appendix(
      'Full Text Search',
      'tokenizer, language dictionary, ranking, full text index maintenance',
      'FULLTEXT index, stopword, minimum token length, ngram parser를 확인합니다.',
      'tsvector, tsquery, GIN/GiST, language configuration, ranking 비용을 확인합니다.',
      'Oracle Text index, lexer, synchronization, optimize 작업을 확인합니다.',
      '언어 tokenizer 검증 없이 검색 품질을 기대하거나 고빈도 DML column에 full text index를 붙이는 경우'
    )),
    ('advanced/monitoring-observability', public.build_reference_depth_appendix(
      'Monitoring / Observability',
      'top SQL, wait event, lock, I/O, log, replication, backup 지표 연결',
      'Performance Schema, sys schema, slow query log, InnoDB status를 연결합니다.',
      'pg_stat_activity, pg_stat_statements, pg_locks, pg_stat_replication을 연결합니다.',
      'AWR, ASH, V$SESSION, V$SQL, DBMS_XPLAN을 SQL_ID와 wait 기준으로 연결합니다.',
      'CPU/disk 사용률만 보고 top SQL과 wait 지표가 없는 경우'
    )),
    ('cases/large-upload', public.build_reference_depth_appendix(
      'Large Upload',
      'staging table, validation, bulk load, chunk commit, promotion',
      'LOAD DATA, generated redo/binlog, unique/foreign key check, replica lag를 확인합니다.',
      'COPY, WAL volume, constraint validation, analyze, autovacuum 영향을 확인합니다.',
      'SQL*Loader, external table, direct path insert, NOLOGGING 복구 영향을 확인합니다.',
      '검증 없이 운영 table에 바로 넣거나 하나의 transaction으로 전체 파일을 처리하는 경우'
    )),
    ('cases/batch-insert', public.build_reference_depth_appendix(
      'Batch Insert',
      'batch size, transaction boundary, index maintenance, log flush',
      'multi-row insert, LOAD DATA, secondary index, innodb_flush_log_at_trx_commit 영향을 확인합니다.',
      'COPY, multi-values insert, WAL compression, checkpoint, synchronous_commit을 확인합니다.',
      'array bind, direct path insert, redo/undo, segment space management를 확인합니다.',
      'batch size만 키워 rollback 시간과 replica apply 비용을 무시하는 경우'
    )),
    ('cases/read-replica', public.build_reference_depth_appendix(
      'Read Replica',
      'stale read, lag threshold, read routing, promotion',
      'GTID, relay log, replica worker 상태와 Seconds_Behind_Source 한계를 확인합니다.',
      'replay lag, hot standby conflict, replication slot WAL retention을 확인합니다.',
      'Active Data Guard apply lag, real-time apply, protection mode를 확인합니다.',
      '로그인 직후 내 정보 조회 같은 read-after-write 요청을 replica로 보내는 경우'
    )),
    ('cases/large-table-migration', public.build_reference_depth_appendix(
      'Large Table Migration',
      'expand-contract, backfill, dual write, cutover, rollback',
      'online DDL 알고리즘, metadata lock, gh-ost/pt-online-schema-change 적용 범위를 확인합니다.',
      'table rewrite 여부, index concurrently, NOT VALID constraint, validation lock을 확인합니다.',
      'DBMS_REDEFINITION, partition exchange, online operation, redo/undo 영향을 확인합니다.',
      'backfill을 단일 transaction으로 처리하거나 rollback 불가능 시점을 정의하지 않는 경우'
    )),
    ('cases/backup-recovery', public.build_reference_depth_appendix(
      'Backup / Recovery',
      'RPO/RTO, PITR, restore rehearsal, archive chain',
      'logical/physical backup, binary log, GTID, replica backup consistency를 확인합니다.',
      'base backup, WAL archive, PITR, archive_command 성공률을 확인합니다.',
      'RMAN, archived redo log, control file backup, FRA 공간을 확인합니다.',
      '백업 성공만 확인하고 목표 시점 restore를 실제로 검증하지 않는 경우'
    )),
    ('cases/connection-pool-exhaustion', public.build_reference_depth_appendix(
      'Connection Pool Exhaustion',
      'pool queue, active session, connection leak, retry storm',
      'max_connections, thread cache, processlist, Performance Schema wait를 확인합니다.',
      'process-per-connection memory, pgbouncer pooling mode, idle in transaction을 확인합니다.',
      'processes/sessions, dedicated/shared server, inactive session, open cursor를 확인합니다.',
      'pool size만 키워 slow query, lock wait, connection leak를 숨기는 경우'
    )),
    ('cases/deadlock-analysis', public.build_reference_depth_appendix(
      'Deadlock Analysis',
      'deadlock graph, lock order, victim SQL, retry policy',
      'SHOW ENGINE INNODB STATUS의 latest detected deadlock과 gap lock을 확인합니다.',
      'deadlock_timeout, log_lock_waits, pg_locks, application transaction 순서를 확인합니다.',
      'ORA-00060 trace, enqueue, ASH blocking chain을 확인합니다.',
      'deadlock을 단순 retry로만 숨기고 transaction lock 순서를 고치지 않는 경우'
    )),
    ('cases/slow-query-tuning', public.build_reference_depth_appendix(
      'Slow Query Tuning',
      'top SQL, execution plan, statistics, wait analysis, data distribution',
      'slow query log, Performance Schema digest, EXPLAIN ANALYZE, optimizer trace를 확인합니다.',
      'pg_stat_statements, EXPLAIN BUFFERS, auto_explain, temp file을 확인합니다.',
      'AWR top SQL, ASH wait, V$SQL, DBMS_XPLAN, plan hash를 확인합니다.',
      'index 추가부터 시작해 write 비용과 데이터 skew, bind 값 분포를 놓치는 경우'
    ))
)
update public.documents d
set content = d.content || a.appendix,
    updated_at = now()
from appendices a
where d.slug = a.slug
  and a.appendix <> ''
  and position('<!-- reference-depth-v2 -->' in d.content) = 0;
