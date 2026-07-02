insert into public.tags (name, type) values
  ('Replication', 'ADVANCED'),
  ('Materialized View', 'ADVANCED'),
  ('JSON', 'ADVANCED'),
  ('Full Text Search', 'ADVANCED'),
  ('Monitoring', 'OPERATION'),
  ('Backup', 'OPERATION'),
  ('Recovery', 'OPERATION'),
  ('Deadlock', 'OPERATION'),
  ('Slow Query', 'OPERATION'),
  ('Migration', 'CASE'),
  ('Upload', 'CASE')
on conflict (name) do nothing;

create or replace function public.build_reference_seed_doc(
  p_title text,
  p_tags text,
  p_scope text,
  p_focus text
)
returns text
language sql
stable
as $$
select format($doc$# %1$s

## 한 줄 결론

%1$s 문서는 %4$s를 DBMS별 구현 차이와 운영 리스크 기준으로 정리합니다. 운영 판단은 기능 지원 여부가 아니라 내부 저장 구조, 통계 품질, lock 범위, 복구 비용, replication 영향까지 함께 확인해야 합니다.

## Tags

%2$s

## 적용 범위

%3$s Managed service에서는 일부 system view 접근과 parameter 변경 권한이 제한될 수 있으므로 vendor 문서와 권한 범위를 함께 확인합니다.

## 핵심 개념

%4$s는 단일 기능으로 보지 않고 transaction, optimizer, storage, memory, replication, backup 정책과 함께 판단해야 합니다. 동일한 SQL이라도 DBMS별 내부 구조가 달라 병목 지점과 회피 전략이 달라집니다.

## 내부 동작

운영 중에는 %4$s와 관련된 metadata, 통계, background worker, log/redo/WAL, lock wait, memory pressure를 함께 확인합니다. 진단은 증상 지표, 실행 계획, wait event, 변경 이력 순서로 좁혀야 합니다.

## 운영 관점

%1$s를 운영 문서로 볼 때는 기능 자체보다 workload 조건과 장애 전파 경로를 먼저 확인해야 합니다. 같은 기능이라도 OLTP, batch, analytics, CDC, read replica, backup window에서는 병목 지점이 다르게 나타납니다.

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

## DBMS별 구현 차이

| 관점 | MySQL | PostgreSQL | Oracle |
|---|---|---|---|
| 진단 기준 | Performance Schema, sys schema, InnoDB status | pg_stat views, EXPLAIN BUFFERS, autovacuum 지표 | AWR, ASH, V$ views, DBMS_XPLAN |
| 운영 영향 | redo/undo, metadata lock, replication lag | WAL, bloat, autovacuum, replication slot | redo/undo, enqueue, archived log, wait event |
| 위험 조건 | 긴 transaction과 대량 DML | stale statistics와 vacuum 지연 | undo 부족과 plan regression |
| 대표 실행 계획 확인 | EXPLAIN, EXPLAIN ANALYZE, optimizer trace | EXPLAIN (ANALYZE, BUFFERS), auto_explain | DBMS_XPLAN, SQL Monitor, AWR |
| 주요 wait/병목 관점 | InnoDB row lock, metadata lock, redo flush, buffer pool miss | lock wait, LWLock, I/O wait, autovacuum, WAL flush | enqueue, latch, buffer busy waits, log file sync |
| 변경 전 검증 | staging workload, invisible index, optimizer switch 영향 | statistics target, enable_* GUC, plan 비교 | SQL Plan Baseline, invisible index, optimizer parameter |
| 장애 전파 경로 | connection pile-up, replication lag, purge lag | connection pile-up, WAL retention, bloat 증가 | session pile-up, archived log pressure, undo pressure |

## MySQL

### 동작 방식

MySQL에서는 %4$s가 InnoDB storage 구조, optimizer statistics, binary log, metadata lock과 연결됩니다. InnoDB status와 Performance Schema를 함께 확인해야 원인을 분리할 수 있습니다.

### 관련 설정

- transaction_isolation
- innodb_buffer_pool_size
- innodb_flush_log_at_trx_commit
- max_connections
- binlog_format

### 진단 방법

- Performance Schema statement digest를 확인합니다.
- SHOW ENGINE INNODB STATUS로 lock, transaction, purge 상태를 봅니다.
- EXPLAIN ANALYZE로 실행 계획의 실제 row와 비용을 확인합니다.

### 운영 주의점

- metadata lock 대기로 DDL과 DML이 함께 지연될 수 있습니다.
- redo/undo 증가가 checkpoint와 I/O pressure를 만들 수 있습니다.
- replica 지연 상태에서 읽기 분산 결과가 오래된 데이터가 될 수 있습니다.

### 실행 계획 해석

- EXPLAIN ANALYZE에서 actual time, rows, loops를 보고 추정치와 실제 처리량 차이를 확인합니다.
- type이 ALL이어도 작은 table이면 정상일 수 있으므로 rows examined와 latency를 함께 봅니다.
- Using temporary, Using filesort는 항상 장애가 아니지만 결과 set 크기와 sort buffer 사용량이 커질 때 위험합니다.
- key가 선택되었더라도 rows가 크면 index 선택도가 낮거나 composite index 순서가 맞지 않을 수 있습니다.
- plan 변경 전후에는 Performance Schema digest 기준으로 누적 비용을 비교합니다.

### 장애 분석 절차

- application timeout 시점과 MySQL slow query log의 timestamp를 맞춥니다.
- SHOW PROCESSLIST 또는 Performance Schema에서 runnable query와 lock wait query를 분리합니다.
- SHOW ENGINE INNODB STATUS에서 latest detected deadlock, history list length, lock wait를 확인합니다.
- replication 구성에서는 source의 commit latency와 replica의 apply lag를 분리합니다.
- DDL 직후라면 metadata lock 대기와 table rebuild 여부를 확인합니다.

## PostgreSQL

### 동작 방식

PostgreSQL에서는 %4$s가 MVCC tuple, WAL, planner statistics, autovacuum, process memory와 연결됩니다. pg_stat 계열 view와 EXPLAIN (ANALYZE, BUFFERS)를 함께 봅니다.

### 관련 설정

- shared_buffers
- work_mem
- autovacuum
- default_statistics_target
- wal_level

### 진단 방법

- pg_stat_activity에서 wait_event와 blocking session을 확인합니다.
- pg_stat_statements로 누적 비용이 큰 SQL을 확인합니다.
- EXPLAIN (ANALYZE, BUFFERS)로 plan과 buffer 사용량을 확인합니다.

### 운영 주의점

- autovacuum 지연은 bloat와 wraparound 위험을 만듭니다.
- work_mem 과대 설정은 동시 실행에서 memory pressure를 유발합니다.
- replication slot 방치는 WAL 증가로 이어질 수 있습니다.

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

## Oracle

### 동작 방식

Oracle에서는 %4$s가 optimizer statistics, undo/redo, enqueue/latch, segment 구조와 연결됩니다. AWR/ASH와 V$ view로 wait 중심 분석을 수행합니다.

### 관련 설정

- optimizer_mode
- statistics_level
- undo_retention
- sga_target
- pga_aggregate_target

### 진단 방법

- V$SESSION에서 wait_class, event, blocking_session을 확인합니다.
- V$SQL에서 elapsed_time, buffer_gets, executions를 확인합니다.
- DBMS_XPLAN DISPLAY_CURSOR로 실제 실행 계획과 predicate를 봅니다.

### 운영 주의점

- undo 부족은 consistent read 실패를 만들 수 있습니다.
- archived redo log 공간 부족은 database 정지를 유발할 수 있습니다.
- 통계 변경은 CBO plan regression으로 이어질 수 있습니다.

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

## 실무 판단 기준

- %4$s 변경 전후의 latency, throughput, error rate를 비교합니다.
- 기능 적용 전에 rollback 절차와 점검 SQL을 준비합니다.
- peak 시간대와 batch window가 겹치는지 확인합니다.
- replication lag와 backup window에 미치는 영향을 산정합니다.
- 실행 계획의 estimated rows와 actual rows 차이를 확인합니다.
- 관련 parameter 변경은 staging에서 workload 기준으로 검증합니다.
- 운영 중단 가능성이 있는 lock 범위와 DDL 특성을 확인합니다.
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

- %4$s 관련 SQL의 p95/p99 latency 증가
- lock wait 또는 blocking session 증가
- redo/WAL/archive log 증가
- buffer/cache hit ratio 저하와 physical read 증가
- 통계 오차로 인한 실행 계획 회귀
- connection pool이 포화되어 DB 병목이 application queueing으로 보입니다.
- lock wait가 증가하면서 CPU 사용률은 낮지만 응답 시간은 길어집니다.
- 통계 갱신 직후 실행 계획이 바뀌고 특정 query만 급격히 느려집니다.
- background maintenance 작업과 batch 작업이 겹쳐 I/O wait가 증가합니다.
- replica lag가 누적되어 읽기 결과가 업무 요구와 맞지 않습니다.
- archive/WAL/binlog 보존량이 증가해 disk pressure가 발생합니다.
- timeout 재시도가 같은 SQL을 중복 실행해 DB 부하를 더 키웁니다.
- 장애 완화용 index 추가가 write latency와 replication lag를 증가시킵니다.

## 진단 체크리스트

- 최근 배포, DDL, parameter 변경 이력을 확인합니다.
- top SQL과 wait event를 함께 확인합니다.
- 실행 계획에서 access path와 join order를 확인합니다.
- lock 대기와 blocking chain을 확인합니다.
- log/redo/WAL 증가량과 disk 여유 공간을 확인합니다.
- replication lag 또는 apply lag를 확인합니다.
- 공식문서의 제한 사항과 version별 차이를 확인합니다.
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

## 예시 SQL

```sql
select digest_text, count_star, avg_timer_wait, sum_rows_examined
from performance_schema.events_statements_summary_by_digest
order by sum_timer_wait desc
limit 10;
```

```sql
select pid, state, wait_event_type, wait_event, query
from pg_stat_activity
where state <> 'idle';
```

```sql
select sid, serial#, wait_class, event, blocking_session
from v$session
where status = 'ACTIVE';
```

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

- MySQL: [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
- PostgreSQL: [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- Oracle: [Oracle Database Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/)
$doc$, p_title, p_tags, p_scope, p_focus);
$$;

create or replace function public.build_architecture_seed_doc(
  p_dbms text,
  p_tags text
)
returns text
language sql
stable
as $$
select format($doc$# %1$s Architecture

## 한 줄 결론

%1$s Architecture는 process/thread, memory, storage, transaction, lock, optimizer, replication, backup/recovery를 하나의 운영 경로로 해석해야 합니다. 장애 분석은 단일 지표가 아니라 wait, log, lock, 실행 계획, 변경 이력을 함께 좁혀야 합니다.

## Tags

%2$s

## 적용 범위

이 문서는 %1$s의 핵심 architecture 구성 요소와 운영 진단 관점을 다룹니다. 세부 버전별 차이는 공식문서의 release note와 parameter reference를 함께 확인해야 합니다.

## 전체 구조

%1$s는 client session, execution engine, buffer/cache, transaction log, storage, replication 경로가 연결된 구조입니다. 성능 저하는 대개 SQL 하나의 문제가 아니라 memory pressure, lock wait, log flush, 통계 오차, background task 지연이 함께 나타납니다.

운영 관점에서는 architecture를 구성 요소 목록으로 보지 않고 요청이 통과하는 경로로 해석해야 합니다. client connection이 생성되고 SQL이 parse/plan/execute 단계를 거쳐 buffer/cache, transaction log, storage, replication, backup 경로에 영향을 남깁니다.

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

connection 처리 구조, background writer/checkpoint/log writer 계열, replication worker를 분리해서 확인합니다. connection이 늘면 memory, scheduler, lock wait 관측 비용도 함께 증가합니다.

### 확인 포인트

- session 수가 증가할 때 process/thread memory가 선형으로 증가하는지 확인합니다.
- idle connection이 많은지, active query가 많은지, lock wait session이 많은지 분리합니다.
- background worker가 필요한 작업을 따라가지 못하면 log, vacuum, purge, checkpoint backlog가 누적됩니다.
- scheduler run queue가 길어지면 DB 내부 wait가 아니라 OS CPU scheduling 지연이 병목일 수 있습니다.
- connection pool의 max size는 DB의 max connection보다 작아야 하며, application instance 수를 곱해서 계산해야 합니다.

## Memory 구조

공유 cache와 session memory를 분리해서 산정합니다. sort, hash, join, temporary 작업은 concurrency와 곱해져 memory pressure를 만들 수 있습니다.

### 메모리 산정 기준

- 공유 cache 영역과 session별 작업 메모리를 분리해서 계산합니다.
- sort/hash/join/temp 작업은 query 하나가 여러 번 사용할 수 있으므로 단순히 connection 수와 곱하면 과소/과대 추정될 수 있습니다.
- OS page cache를 사용하는 DBMS와 자체 buffer cache 의존도가 높은 DBMS를 구분합니다.
- memory pressure가 swap으로 이어지면 DB 지연은 급격히 커지므로 swap 사용량을 별도 경보로 둡니다.
- cache hit ratio만으로 충분하지 않으며 working set 크기, full scan 빈도, checkpoint I/O를 함께 확인합니다.

## Storage 구조

row 저장 단위, index row locator, page/block layout, tablespace/datafile 구성을 확인합니다. storage 구조는 random I/O, index lookup, backup 크기, bloat 또는 fragmentation에 영향을 줍니다.

### 저장소 운영 기준

- data file, transaction log, archive/WAL/binlog, temporary file, backup 영역을 분리해서 용량을 산정합니다.
- random read, sequential scan, log flush, checkpoint write는 서로 다른 I/O 패턴입니다.
- index가 늘면 read path만 좋아지는 것이 아니라 write path, backup size, restore time이 함께 증가합니다.
- bloat, fragmentation, page split, dead tuple은 모두 storage 증가로 보이지만 원인과 조치가 다릅니다.
- cloud volume에서는 IOPS, throughput, burst credit, latency percentile을 함께 확인합니다.

## Transaction / MVCC 구조

consistent read를 위해 과거 version 또는 undo 정보를 유지합니다. 긴 transaction은 version 정리를 막고 undo/WAL/redo 증가, vacuum/purge 지연, snapshot 오류를 유발할 수 있습니다.

### 운영 영향

- long transaction은 과거 version 정리를 막고 undo/WAL/redo retention을 증가시킵니다.
- isolation level은 read consistency뿐 아니라 lock 범위, phantom 처리, retry 필요성에 영향을 줍니다.
- batch transaction이 너무 크면 rollback 시간과 replication apply 시간이 길어집니다.
- autocommit 여부는 lock 보유 시간과 log flush 빈도를 바꿉니다.
- backup snapshot과 long-running report query는 MVCC 정리 지연의 원인이 될 수 있습니다.

## Lock 구조

row lock, table lock, metadata lock, enqueue/latch 계열을 구분합니다. blocking session과 wait event를 함께 보아야 원인 session과 피해 session을 분리할 수 있습니다.

### lock 분석 기준

- blocker와 waiter를 분리하고 blocker가 실제로 CPU를 쓰는지 idle in transaction인지 확인합니다.
- row lock과 metadata/schema lock은 증상이 비슷해도 대응 절차가 다릅니다.
- deadlock은 victim query만 보지 말고 transaction 내부의 lock 획득 순서를 재구성해야 합니다.
- lock timeout은 완화책일 수 있지만 application retry가 중복 부하를 만들 수 있습니다.
- DDL은 짧아 보여도 metadata lock 또는 table rewrite 때문에 운영 영향이 커질 수 있습니다.

## Optimizer / Execution 구조

optimizer는 object statistics, histogram, cost parameter, runtime feedback을 사용합니다. 실행 계획은 estimated rows, actual rows, access path, join order, buffer 사용량 기준으로 검증합니다.

### 실행 계획 운영 기준

- estimated rows와 actual rows 차이가 큰 node가 plan regression의 출발점입니다.
- 통계 수집은 성능 개선 작업이지만 동시에 plan 변경을 유발하는 운영 이벤트입니다.
- index scan, full scan, hash join, nested loop는 각각 정상일 수 있으므로 row count와 buffer 사용량으로 판단합니다.
- bind variable, prepared statement, histogram, adaptive plan은 같은 SQL의 plan을 여러 개로 만들 수 있습니다.
- 실행 계획은 단일 query latency뿐 아니라 전체 system resource 사용량 관점으로 봐야 합니다.

## Replication / HA 구조

replication은 쓰기 확장 기능이 아니라 장애 대응과 읽기 분산 구조입니다. lag, apply delay, conflict, failover RPO/RTO, stale read 가능성을 별도로 관리해야 합니다.

### HA 판단 기준

- replication lag는 전송 지연과 apply 지연을 분리해서 확인합니다.
- failover 절차는 promotion 이후 application endpoint, DNS, connection pool, read/write routing까지 포함해야 합니다.
- synchronous replication은 데이터 손실 가능성을 줄이지만 commit latency와 장애 전파 가능성을 높입니다.
- logical replication과 physical replication은 schema 변경, DDL 전파, conflict 처리 방식이 다릅니다.
- read replica는 성능 확장 수단이지만 read-your-writes 요구가 있으면 routing 기준이 필요합니다.

## Backup / Recovery 구조

logical backup, physical backup, archived log/WAL/binlog, point-in-time recovery를 복구 목표별로 선택합니다. backup 성공보다 restore 검증이 운영 기준입니다.

### 복구 기준

- RPO와 RTO를 수치로 정하고 backup 방식이 이를 만족하는지 검증합니다.
- backup 성공 여부보다 restore rehearsal 성공 여부를 더 중요한 운영 지표로 둡니다.
- PITR은 base backup과 log/archive chain이 모두 정상이어야 합니다.
- 암호화, 압축, network 전송, object storage lifecycle이 restore 시간에 영향을 줍니다.
- schema migration 직후에는 backup compatibility와 rollback 가능성을 별도로 확인합니다.

## Monitoring / Observability

top SQL, wait event, lock wait, buffer/cache hit, physical read/write, redo/WAL/archive log 증가량, replication lag를 함께 수집합니다.

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

- connection/session limit
- buffer/cache size
- transaction log flush policy
- optimizer statistics policy
- undo/WAL/redo retention
- replication configuration
- backup retention

### 파라미터 변경 절차

- parameter 적용 단위가 session, database, instance, cluster 중 무엇인지 확인합니다.
- restart 또는 failover가 필요한지 확인합니다.
- 변경 전후 비교 지표를 정하고, peak 시간대 전후로 관측합니다.
- managed service의 parameter group 반영 시점과 pending-reboot 상태를 확인합니다.
- 여러 parameter를 동시에 변경하지 않고 원인 추적이 가능한 단위로 나눕니다.
- rollback 값을 미리 기록합니다.

## 진단 쿼리

```sql
select current_timestamp;
```

```sql
select 1 as health_check;
```

```sql
select 1 as replication_or_backup_check;
```

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

- connection 증가가 memory와 scheduler pressure로 이어질 수 있습니다.
- 긴 transaction은 version 정리와 backup window에 영향을 줍니다.
- log/archive 공간 부족은 쓰기 중단 또는 database hang으로 이어질 수 있습니다.
- 통계 오차는 plan regression을 유발할 수 있습니다.
- failover 절차를 검증하지 않으면 장애 시 RTO가 예측보다 길어집니다.
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

- MySQL: [MySQL Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
- PostgreSQL: [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- Oracle: [Oracle Database Documentation](https://docs.oracle.com/en/database/oracle/oracle-database/)
$doc$, p_dbms, p_tags);
$$;

create or replace function public.build_json_jsonb_seed_doc()
returns text
language sql
stable
as $$
select $doc$# JSON / JSONB

## 한 줄 결론

JSON 컬럼은 RDBMS 안에서 가변 구조 데이터를 다루기 위한 도구입니다. 다만 JSON을 정규 컬럼의 대체재로 쓰면 무결성, 인덱싱, 집계, 복제, 부분 업데이트 비용이 운영 리스크로 돌아옵니다.

## Tags

`JSON` `MySQL` `PostgreSQL` `Oracle`

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

## 장점

- DDL 없이 가변 필드를 추가할 수 있습니다.
- 카테고리별 상품 속성처럼 sparse한 구조를 한 컬럼에 저장할 수 있습니다.
- 주문 snapshot, 외부 API 원본, webhook payload처럼 원본 보관이 필요한 데이터에 유용합니다.
- 이벤트 payload처럼 event_type별 구조가 다른 데이터를 관리하기 쉽습니다.
- 초기 실험 단계에서 schema가 안정되기 전까지 구현 속도를 높일 수 있습니다.

## 단점

- NOT NULL, UNIQUE, FOREIGN KEY 같은 DB 제약조건을 JSON 내부 key에 직접 적용하기 어렵습니다.
- JSON path 조건은 expression 평가와 type cast 때문에 일반 정규 컬럼보다 비용이 큽니다.
- JSON 내부 값을 JOIN, GROUP BY, ORDER BY에 쓰면 query가 복잡해지고 optimizer 추정이 어려워집니다.
- 같은 JSON 컬럼 안에 version별 구조가 섞이면 application parser와 운영 query가 복잡해집니다.
- 큰 JSON은 storage, backup, cache, WAL/binlog/redo 사용량을 증가시킵니다.
- 부분 업데이트 문법이 있어도 실제로는 전체 value rewrite 또는 새 row version 생성 비용이 발생할 수 있습니다.

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

자주 쓰는 필드는 정규 컬럼으로 두고, 가변 속성만 JSON으로 둡니다.

```sql
create table products (
  id bigint primary key,
  name varchar(200) not null,
  price decimal(10, 2) not null,
  category varchar(50) not null,
  attributes json,
  created_at timestamp not null
);
```

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
- pg_stat_statements에서 jsonb 연산 query의 평균 실행 시간을 확인합니다.

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

```sql
alter table orders
add delivery_type varchar(20)
  generated always as (json_unquote(json_extract(options, '$.delivery_type'))) virtual,
add index idx_orders_delivery_type (delivery_type);
```

```sql
create index idx_orders_options_gin
on orders using gin (options jsonb_path_ops);
```

```sql
create index idx_orders_delivery_type_expr
on orders ((options->>'delivery_type'));
```

인덱스는 query를 빠르게 만들지만 write path를 느리게 합니다. JSON index는 특히 크기가 커질 수 있으므로 index scan 횟수, index size, write latency, vacuum/purge 비용을 함께 봐야 합니다.

## 크기 제한

JSON 컬럼은 크기 제한이 없다고 생각하기 쉽지만 운영에서는 반드시 상한을 둬야 합니다. 작은 JSON은 편의성이 크지만 수백 KB 이상의 JSON이 row에 들어가기 시작하면 backup, replication, cache, update 비용이 증가합니다.

일반 속성 데이터는 10KB 이하, 이벤트 payload는 64KB 이하, 외부 원본 보관은 별도 table과 retention 정책을 두는 편이 안전합니다.

## 정규 컬럼 승격 기준

- 해당 key로 검색하는 query가 생겼습니다.
- 해당 key에 NOT NULL 또는 UNIQUE가 필요합니다.
- 해당 key가 join key가 되었습니다.
- 해당 key가 리포팅이나 집계 대상이 되었습니다.
- 해당 key가 자주 update됩니다.
- 해당 key를 기준으로 장애 분석이나 운영 대응이 반복됩니다.

## 마이그레이션 절차

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

## 예시 SQL

```sql
select table_schema, table_name, column_name
from information_schema.columns
where data_type = 'json';
```

```sql
select query, calls, mean_exec_time, rows
from pg_stat_statements
where query ilike '%jsonb%' or query ilike '%->>%'
order by total_exec_time desc
limit 20;
```

```sql
select sql_id, executions, elapsed_time, buffer_gets, sql_text
from v$sql
where lower(sql_text) like '%json_value%'
   or lower(sql_text) like '%json_table%'
order by elapsed_time desc
fetch first 20 rows only;
```

## 공식문서 참고

- MySQL: [The JSON Data Type](https://dev.mysql.com/doc/refman/8.0/en/json.html)
- MySQL: [Generated Columns](https://dev.mysql.com/doc/refman/8.0/en/create-table-generated-columns.html)
- PostgreSQL: [JSON Types](https://www.postgresql.org/docs/current/datatype-json.html)
- PostgreSQL: [GIN Indexes](https://www.postgresql.org/docs/current/gin.html)
- Oracle: [JSON Developer's Guide](https://docs.oracle.com/en/database/oracle/oracle-database/)
$doc$;
$$;

insert into public.documents (slug, title, description, content, category, level, status, published_at)
values
  ('dbms/mysql/architecture', 'MySQL Architecture', 'MySQL Architecture는 SQL 계층과 InnoDB storage engine 계층을 운영 경로 기준으로 정리합니다.', public.build_architecture_seed_doc('MySQL', '`MySQL` `Architecture` `MVCC` `Lock` `Optimizer`'), 'dbms', 'reference', 'published', now()),
  ('dbms/postgresql/architecture', 'PostgreSQL Architecture', 'PostgreSQL Architecture는 process-per-connection, shared buffers, WAL, MVCC, autovacuum을 운영 기준으로 정리합니다.', public.build_architecture_seed_doc('PostgreSQL', '`PostgreSQL` `Architecture` `MVCC` `Optimizer` `Monitoring`'), 'dbms', 'reference', 'published', now()),
  ('dbms/oracle/architecture', 'Oracle Architecture', 'Oracle Architecture는 SGA/PGA, undo/redo, wait event, backup/recovery를 운영 기준으로 정리합니다.', public.build_architecture_seed_doc('Oracle', '`Oracle` `Architecture` `MVCC` `Lock` `Monitoring`'), 'dbms', 'reference', 'published', now()),
  ('concepts/index', 'Index', 'Index는 access path를 줄이지만 write amplification, 통계 오차, lock 경합, storage 증가를 함께 만드는 운영 자산입니다.', public.build_reference_seed_doc('Index', '`Index` `Optimizer` `MySQL` `PostgreSQL` `Oracle`', 'B-Tree 계열 index, composite index, covering/index only scan, expression/function index, partial/invisible/bitmap index의 운영 판단을 다룹니다.', 'index 설계, row locator, covering scan, write amplification'), 'concept', 'reference', 'published', now()),
  ('concepts/mvcc', 'MVCC', 'MVCC는 read consistency를 제공하지만 version 보관, 정리 지연, 긴 transaction, replication, backup에 운영 비용을 전파합니다.', public.build_reference_seed_doc('MVCC', '`MVCC` `MySQL` `PostgreSQL` `Oracle`', 'OLTP transaction에서 consistent read, undo/tuple version, vacuum/purge, snapshot 수명과 장애 패턴을 다룹니다.', 'MVCC, undo, tuple version, snapshot visibility, version cleanup'), 'concept', 'reference', 'published', now()),
  ('concepts/transaction-isolation', 'Transaction Isolation', 'Transaction Isolation은 anomaly 허용 범위, lock 범위, MVCC snapshot 수명을 함께 결정합니다.', public.build_reference_seed_doc('Transaction Isolation', '`MVCC` `Lock` `MySQL` `PostgreSQL` `Oracle`', 'isolation level, anomaly, consistent read, write conflict를 다룹니다.', 'isolation level, anomaly, consistent read, write conflict'), 'concept', 'reference', 'published', now()),
  ('concepts/lock', 'Lock', 'Lock은 row 변경 보호만이 아니라 DDL, metadata, predicate, enqueue 대기를 통해 전체 처리량을 제한할 수 있습니다.', public.build_reference_seed_doc('Lock', '`Lock` `MySQL` `PostgreSQL` `Oracle`', 'row lock, table lock, metadata lock, enqueue, blocking chain을 다룹니다.', 'row lock, table lock, metadata lock, enqueue, blocking chain'), 'concept', 'reference', 'published', now()),
  ('concepts/execution-plan', 'Execution Plan', 'Execution Plan은 optimizer 추정과 실제 실행 차이를 확인하는 운영 진단 도구입니다.', public.build_reference_seed_doc('Execution Plan', '`Optimizer` `MySQL` `PostgreSQL` `Oracle`', '실행 계획 해석, access path, join order, estimated rows와 actual rows 비교를 다룹니다.', '실행 계획 해석, access path, join order, estimated rows와 actual rows 비교'), 'concept', 'reference', 'published', now()),
  ('concepts/optimizer-statistics', 'Optimizer Statistics', 'Optimizer Statistics는 plan 품질을 좌우하며 stale statistics는 장애처럼 보이는 성능 회귀를 만들 수 있습니다.', public.build_reference_seed_doc('Optimizer Statistics', '`Optimizer` `MySQL` `PostgreSQL` `Oracle`', '통계 수집, histogram, cardinality estimation, plan regression을 다룹니다.', '통계 수집, histogram, cardinality estimation, plan regression'), 'concept', 'reference', 'published', now()),
  ('advanced/partitioning', 'Partitioning', 'Partitioning은 대형 테이블 관리 단위를 나누지만 pruning 실패와 maintenance lock을 함께 관리해야 합니다.', public.build_reference_seed_doc('Partitioning', '`Partitioning` `MySQL` `PostgreSQL` `Oracle`', 'partition pruning, partition maintenance, 대형 테이블 운영을 다룹니다.', 'partition pruning, partition maintenance, 대형 테이블 운영'), 'advanced', 'reference', 'published', now()),
  ('advanced/replication', 'Replication', 'Replication은 읽기 분산과 장애 대응에 유용하지만 lag, consistency, failover 절차가 운영 리스크입니다.', public.build_reference_seed_doc('Replication', '`Replication` `MySQL` `PostgreSQL` `Oracle`', 'replication lag, consistency, failover, log shipping을 다룹니다.', 'replication lag, consistency, failover, log shipping'), 'advanced', 'reference', 'published', now()),
  ('advanced/materialized-view', 'Materialized View', 'Materialized View는 precomputed result를 제공하지만 refresh 비용과 stale data를 명시적으로 관리해야 합니다.', public.build_reference_seed_doc('Materialized View', '`Materialized View` `MySQL` `PostgreSQL` `Oracle`', 'materialized view refresh, query rewrite, stale data 관리를 다룹니다.', 'materialized view refresh, query rewrite, stale data 관리'), 'advanced', 'reference', 'published', now()),
  ('advanced/json-jsonb', 'JSON / JSONB', 'JSON 저장은 schema 유연성을 제공하지만 무결성, 인덱싱, 집계, 복제, 부분 업데이트 비용을 운영 리스크로 만듭니다.', public.build_json_jsonb_seed_doc(), 'advanced', 'reference', 'published', now()),
  ('advanced/full-text-search', 'Full Text Search', 'Full Text Search는 DB 내 검색을 단순화하지만 tokenizer, ranking, language configuration 한계를 검토해야 합니다.', public.build_reference_seed_doc('Full Text Search', '`Full Text Search` `MySQL` `PostgreSQL` `Oracle`', '전문 검색 index, tokenizer, ranking, language configuration을 다룹니다.', '전문 검색 index, tokenizer, ranking, language configuration'), 'advanced', 'reference', 'published', now()),
  ('advanced/monitoring-observability', 'Monitoring / Observability', 'Monitoring은 단일 metric 수집이 아니라 wait, SQL, lock, I/O, replication을 연결하는 운영 체계입니다.', public.build_reference_seed_doc('Monitoring / Observability', '`Monitoring` `MySQL` `PostgreSQL` `Oracle`', 'wait event, top SQL, lock, I/O, replication lag 관측을 다룹니다.', 'wait event, top SQL, lock, I/O, replication lag 관측'), 'advanced', 'reference', 'published', now()),
  ('cases/large-upload', 'Large Upload', 'Large Upload는 bulk path보다 redo/WAL/undo, index maintenance, lock 범위를 먼저 산정해야 합니다.', public.build_reference_seed_doc('Large Upload', '`Upload` `MySQL` `PostgreSQL` `Oracle`', '대용량 업로드, staging table, bulk load, redo/WAL/undo 증가를 다룹니다.', '대용량 업로드, staging table, bulk load, redo/WAL/undo 증가'), 'case', 'reference', 'published', now()),
  ('cases/batch-insert', 'Batch Insert', 'Batch Insert는 network round trip을 줄이지만 transaction size와 log flush 비용을 함께 증가시킬 수 있습니다.', public.build_reference_seed_doc('Batch Insert', '`Upload` `MySQL` `PostgreSQL` `Oracle`', 'batch insert, transaction boundary, index maintenance, network round trip을 다룹니다.', 'batch insert, transaction boundary, index maintenance, network round trip'), 'case', 'reference', 'published', now()),
  ('cases/read-replica', 'Read Replica', 'Read Replica는 읽기 분산 구조이지만 stale read와 lag 기반 장애 전파를 관리해야 합니다.', public.build_reference_seed_doc('Read Replica', '`Replication` `MySQL` `PostgreSQL` `Oracle`', 'read replica, stale read, lag, read routing을 다룹니다.', 'read replica, stale read, lag, read routing'), 'case', 'reference', 'published', now()),
  ('cases/large-table-migration', 'Large Table Migration', 'Large Table Migration은 backfill, dual write, cutover, rollback을 별도 단계로 검증해야 합니다.', public.build_reference_seed_doc('Large Table Migration', '`Migration` `MySQL` `PostgreSQL` `Oracle`', '대형 테이블 migration, backfill, dual write, cutover를 다룹니다.', '대형 테이블 migration, backfill, dual write, cutover'), 'case', 'reference', 'published', now()),
  ('cases/backup-recovery', 'Backup / Recovery', 'Backup / Recovery는 백업 성공보다 restore 검증과 recovery objective 충족 여부가 핵심입니다.', public.build_reference_seed_doc('Backup / Recovery', '`Backup` `Recovery` `MySQL` `PostgreSQL` `Oracle`', 'backup, restore, point-in-time recovery, recovery objective를 다룹니다.', 'backup, restore, point-in-time recovery, recovery objective'), 'case', 'reference', 'published', now()),
  ('cases/connection-pool-exhaustion', 'Connection Pool Exhaustion', 'Connection Pool Exhaustion은 DB connection limit보다 application queueing, long transaction, session leak를 함께 보아야 합니다.', public.build_reference_seed_doc('Connection Pool Exhaustion', '`Monitoring` `MySQL` `PostgreSQL` `Oracle`', 'connection pool exhaustion, session leak, max connection, queueing을 다룹니다.', 'connection pool exhaustion, session leak, max connection, queueing'), 'case', 'reference', 'published', now()),
  ('cases/deadlock-analysis', 'Deadlock Analysis', 'Deadlock Analysis는 victim SQL만이 아니라 lock 획득 순서와 transaction 경계를 재구성해야 합니다.', public.build_reference_seed_doc('Deadlock Analysis', '`Deadlock` `Lock` `MySQL` `PostgreSQL` `Oracle`', 'deadlock graph, lock order, transaction retry, blocking analysis를 다룹니다.', 'deadlock graph, lock order, transaction retry, blocking analysis'), 'case', 'reference', 'published', now()),
  ('cases/slow-query-tuning', 'Slow Query Tuning', 'Slow Query Tuning은 index 추가보다 실행 계획, 통계, wait event, 데이터 분포를 먼저 확인해야 합니다.', public.build_reference_seed_doc('Slow Query Tuning', '`Slow Query` `Optimizer` `MySQL` `PostgreSQL` `Oracle`', 'slow query tuning, plan regression, index, statistics, wait analysis를 다룹니다.', 'slow query tuning, plan regression, index, statistics, wait analysis'), 'case', 'reference', 'published', now())
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  content = excluded.content,
  category = excluded.category,
  level = excluded.level,
  status = excluded.status,
  published_at = coalesce(public.documents.published_at, excluded.published_at),
  updated_at = now(),
  deleted_at = null;
