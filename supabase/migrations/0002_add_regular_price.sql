-- 공동구매가 대비 할인율을 보여주기 위한 "정가(할인 전 가격)" 필드 추가
alter table campaigns
  add column regular_price integer check (regular_price is null or regular_price > 0);
