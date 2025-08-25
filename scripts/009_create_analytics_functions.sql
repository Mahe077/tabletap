
create or replace function get_restaurant_analytics(restaurant_id_param uuid)
returns json as $$
declare
  analytics json;
begin
  select json_build_object(
    'today_revenue', coalesce(sum(case when created_at >= current_date and status = 'completed' then total_amount else 0 end), 0),
    'month_revenue', coalesce(sum(case when created_at >= date_trunc('month', current_date) and status = 'completed' then total_amount else 0 end), 0),
    'all_time_revenue', coalesce(sum(case when status = 'completed' then total_amount else 0 end), 0),
    'today_orders', count(case when created_at >= current_date then 1 end),
    'month_orders', count(case when created_at >= date_trunc('month', current_date) then 1 end)
  )
  into analytics
  from orders
  where restaurant_id = restaurant_id_param;

  return analytics;
end;
$$ language plpgsql;

create or replace function get_popular_items(restaurant_id_param uuid)
returns json as $$
declare
  popular_items json;
begin
  select json_agg(json_build_object('name', m.name, 'count', oi.quantity, 'price', m.price))
  into popular_items
  from (
    select menu_item_id, sum(quantity) as quantity
    from order_items
    join orders on order_items.order_id = orders.id
    where orders.restaurant_id = restaurant_id_param
    group by menu_item_id
    order by sum(quantity) desc
    limit 5
  ) as oi
  join menu_items m on oi.menu_item_id = m.id;

  return popular_items;
end;
$$ language plpgsql;
