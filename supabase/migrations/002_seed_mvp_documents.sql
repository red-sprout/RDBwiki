insert into public.tags (name, type) values
  ('MySQL', 'DBMS'),
  ('PostgreSQL', 'DBMS'),
  ('Oracle', 'DBMS'),
  ('Index', 'TOPIC'),
  ('MVCC', 'TOPIC'),
  ('Lock', 'TOPIC'),
  ('Optimizer', 'TOPIC'),
  ('Architecture', 'INTERNAL'),
  ('Advanced', 'ADVANCED'),
  ('BufferPool', 'INTERNAL'),
  ('UndoLog', 'INTERNAL'),
  ('Vacuum', 'INTERNAL'),
  ('ROWID', 'INTERNAL')
on conflict (name) do nothing;

insert into public.documents (slug, title, description, content, category, level, status, published_at)
values
  ('concepts/index', 'Index', 'B-Tree 인덱스와 DBMS별 실행 계획 활용 차이를 비교합니다.', '# Index

## 한 줄 결론

인덱스는 읽기 성능을 높이지만 쓰기 비용과 통계 품질까지 함께 관리해야 합니다.

## DBMS 비교

| 관점 | MySQL | PostgreSQL | Oracle |
|---|---|---|---|
| 대표 구조 | B+Tree | B-Tree | B-Tree |
| 특징 | clustered primary key | heap + secondary index | ROWID 기반 접근 |
| 주의점 | leftmost prefix | bloat, visibility map | clustering factor |', 'concept', 'reference', 'published', now()),
  ('concepts/mvcc', 'MVCC', 'MySQL, PostgreSQL, Oracle의 MVCC 구현 차이를 비교합니다.', '# MVCC

MVCC는 읽기와 쓰기의 충돌을 줄이기 위해 여러 버전을 관리하는 방식입니다.

## 한 줄 결론

MySQL, PostgreSQL, Oracle은 모두 MVCC를 제공하지만, 버전 저장 위치와 정리 방식이 다릅니다.

## DBMS 비교

| 관점 | MySQL | PostgreSQL | Oracle |
|---|---|---|---|
| 버전 저장 | Undo Log | Tuple Version | Undo Segment |
| 정리 방식 | Purge | Vacuum | Undo Retention |
| 대표 이슈 | Gap Lock | Dead Tuple | Snapshot Too Old |', 'concept', 'reference', 'published', now()),
  ('concepts/transaction-isolation', 'Transaction Isolation', '격리 수준별 anomaly와 DBMS별 기본 동작을 정리합니다.', '# Transaction Isolation

## DBMS 비교

| 관점 | MySQL | PostgreSQL | Oracle |
|---|---|---|---|
| 기본값 | Repeatable Read | Read Committed | Read Committed |
| Serializable | next-key lock 중심 | SSI | Serializable isolation |', 'concept', 'reference', 'published', now()),
  ('concepts/lock', 'Lock', 'Lock 종류와 경합 분석 관점을 정리합니다.', '# Lock

## DBMS 비교

| 관점 | MySQL | PostgreSQL | Oracle |
|---|---|---|---|
| 대표 이슈 | gap lock | row/table lock | enqueue/latch |
| 확인 | performance_schema | pg_locks | v$lock |', 'concept', 'reference', 'published', now()),
  ('concepts/execution-plan', 'Execution Plan', '실행 계획을 읽는 공통 관점과 DBMS별 차이를 정리합니다.', '# Execution Plan

## 확인할 것

access path, join order, estimated rows, actual rows, buffer usage를 함께 봅니다.', 'concept', 'reference', 'published', now()),
  ('concepts/optimizer-statistics', 'Optimizer Statistics', '통계 정보가 실행 계획에 미치는 영향을 정리합니다.', '# Optimizer Statistics

## 핵심

통계는 optimizer의 입력값입니다. stale stats는 잘못된 join order와 access path를 만들 수 있습니다.', 'concept', 'reference', 'published', now()),
  ('dbms/mysql/architecture', 'MySQL Architecture', 'InnoDB 중심으로 MySQL 서버 계층과 스토리지 엔진을 정리합니다.', '# MySQL Architecture

## 핵심 구성

| 영역 | 역할 |
|---|---|
| Parser / Optimizer | SQL 파싱과 실행 계획 생성 |
| InnoDB Buffer Pool | 데이터와 인덱스 페이지 캐시 |
| Redo Log | crash recovery |
| Undo Log | rollback과 consistent read |', 'dbms', 'reference', 'published', now()),
  ('dbms/postgresql/architecture', 'PostgreSQL Architecture', 'PostgreSQL 프로세스 모델, WAL, Vacuum의 위치를 정리합니다.', '# PostgreSQL Architecture

## 핵심 구성

| 영역 | 역할 |
|---|---|
| Shared Buffers | 공용 페이지 캐시 |
| WAL | 변경 로그와 복구 |
| Autovacuum | dead tuple 정리 |
| Planner | 통계 기반 실행 계획 선택 |', 'dbms', 'reference', 'published', now()),
  ('dbms/oracle/architecture', 'Oracle Architecture', 'SGA, PGA, process, undo/redo 중심으로 Oracle 구조를 정리합니다.', '# Oracle Architecture

## 핵심 구성

| 영역 | 역할 |
|---|---|
| SGA | shared memory |
| PGA | process private memory |
| Redo Log | 변경 이력 |
| Undo Segment | rollback과 consistent read |', 'dbms', 'reference', 'published', now()),
  ('advanced/partitioning', 'Partitioning', '대형 테이블을 partition으로 나누는 기준과 주의점을 비교합니다.', '# Partitioning

## DBMS 비교

| 관점 | MySQL | PostgreSQL | Oracle |
|---|---|---|---|
| pruning | partition pruning | constraint exclusion/pruning | partition pruning |
| 운영 | exchange 제한적 | attach/detach | exchange partition |', 'advanced', 'reference', 'published', now()),
  ('advanced/replication', 'Replication', '복제 방식과 읽기 확장 패턴을 비교합니다.', '# Replication

## 핵심

복제는 읽기 확장과 장애 대응에 유용하지만 replication lag와 consistency tradeoff를 항상 고려해야 합니다.', 'advanced', 'reference', 'published', now()),
  ('advanced/materialized-view', 'Materialized View', 'Materialized View 지원 방식과 refresh 전략을 비교합니다.', '# Materialized View

## DBMS 비교

| 관점 | MySQL | PostgreSQL | Oracle |
|---|---|---|---|
| 내장 지원 | 없음 | 있음 | 있음 |
| refresh | 직접 구현 | refresh materialized view | fast/complete refresh |', 'advanced', 'reference', 'published', now()),
  ('advanced/json-jsonb', 'JSON / JSONB', 'JSON 타입과 인덱싱 전략을 비교합니다.', '# JSON / JSONB

## 핵심

JSON은 유연하지만 스키마, 인덱스, 통계 품질을 명시적으로 관리해야 합니다.', 'advanced', 'reference', 'published', now()),
  ('advanced/full-text-search', 'Full Text Search', 'DB 내장 전문 검색 기능의 범위와 한계를 비교합니다.', '# Full Text Search

## 핵심

내장 전문 검색은 운영 단순성이 장점이지만 검색 랭킹과 언어 처리 요구가 높으면 검색 엔진 분리를 검토합니다.', 'advanced', 'reference', 'published', now()),
  ('advanced/monitoring-observability', 'Monitoring / Observability', 'DB 상태를 관측하기 위한 핵심 지표를 정리합니다.', '# Monitoring / Observability

## 지표

latency, throughput, lock wait, buffer/cache hit, redo/WAL pressure, replication lag를 함께 봅니다.', 'advanced', 'reference', 'published', now()),
  ('cases/large-upload', 'Large Upload', '대용량 업로드에서 DB별 부하 지점을 비교합니다.', '# Large Upload

## DBMS 비교

| 관점 | MySQL | PostgreSQL | Oracle |
|---|---|---|---|
| bulk path | LOAD DATA | COPY | SQL*Loader |
| 주의점 | redo/undo 증가 | WAL 증가와 autovacuum | undo/redo와 direct path |', 'case', 'reference', 'published', now()),
  ('cases/batch-insert', 'Batch Insert', 'Batch insert 성능을 높이는 실무 패턴입니다.', '# Batch Insert

## 핵심

batch size, transaction boundary, index maintenance, network round trip을 함께 조정합니다.', 'case', 'reference', 'published', now()),
  ('cases/read-replica', 'Read Replica', 'Read replica 운영 시 consistency와 lag를 다룹니다.', '# Read Replica

## 핵심

읽기 분산은 단순한 확장 수단이 아니라 replica lag와 read-your-writes 요구사항을 함께 통제해야 하는 운영 구조입니다.', 'case', 'reference', 'published', now()),
  ('cases/large-table-migration', 'Large Table Migration', '대형 테이블 마이그레이션 전략을 정리합니다.', '# Large Table Migration

## 핵심

online DDL, shadow table, backfill, dual write, cutover 계획을 나눠서 위험을 낮춥니다.', 'case', 'reference', 'published', now())
on conflict (slug) do nothing;
