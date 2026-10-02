-- Rollback for 022_concession_trading_concept.sql
delete from concepts where slug = 'concession_trading';
