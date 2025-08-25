
create or replace function get_today_revenue(restaurant_id_param uuid)
returns numeric as $$
declare
  total_revenue numeric;
begin
  select coalesce(sum(total), 0)
  into total_revenue
  from orders
  where restaurant_id = restaurant_id_param
  and created_at >= current_date;
  return total_revenue;
end;
$$ language plpgsql;

create or replace function get_month_revenue(restaurant_id_param uuid)
returns numeric as $$
declare
  total_revenue numeric;
begin
  select coalesce(sum(total), 0)
  into total_revenue
  from orders
  where restaurant_id = restaurant_id_param
  and created_at >= date_trunc('month', current_date);
  return total_revenue;
end;
$$ language plpgsql;

create or replace function get_total_revenue(restaurant_id_param uuid)
returns numeric as $$
declare
  total_revenue numeric;
begin
  select coalesce(sum(total), 0)
  into total_revenue
  from orders
  where restaurant_id = restaurant_id_param;
  return total_revenue;
end;
$$ language plpgsql;
