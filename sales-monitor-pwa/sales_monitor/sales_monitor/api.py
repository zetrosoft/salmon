# This is a more realistic api.py file for your Frappe application.
# YOU MUST VERIFY AND ADJUST DOCTYPE NAMES AND FIELD NAMES TO MATCH YOUR ACTUAL FRAPPE SETUP.

import frappe
from frappe.utils import getdate, now_datetime

@frappe.whitelist(allow_guest=True)
def get_sales_visit_plans(sales_name, date):
    # ASSUMPTION: Your Sales Visit Plan DocType is named 'Sales Visit Plan'
    # ASSUMPTION: It has fields like 'sales_person', 'visit_date', 'customer', 'address', 'status'
    # ASSUMPTION: 'customer' field is the store name

    # Convert date string to Frappe's date format if necessary
    # For simplicity, assuming date is already in a comparable format (YYYY-MM-DD)
    today_date = getdate(date) # Use getdate to ensure proper date object

    try:
        # Fetch Sales Visit Plans for the given sales_name and today's date
        # Filter out 'Selesai' status as per PWA logic
        visit_plans = frappe.db.get_list(
            "Sales Visit Plan",
            filters={
                "sales_person": sales_name,
                "visit_date": today_date,
                "status": ["!=", "Selesai"] # Exclude completed plans
            },
            fields=[
                "name",
                "customer as store_name", # Assuming 'customer' is the store name
                "address",
                "status",
                "checkin_time",
                "checkout_time",
                "latitude",
                "longitude",
                "photo_url"
            ],
            as_dict=True
        )
        return visit_plans
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Error in get_sales_visit_plans")
        frappe.throw(f"Failed to fetch sales visit plans: {e}")

@frappe.whitelist()
def update_sales_visit_plan_status(name, new_status, latitude=None, longitude=None, photo_url=None):
    # ASSUMPTION: Your Sales Visit Plan DocType is named 'Sales Visit Plan'
    # ASSUMPTION: It has fields like 'status', 'checkin_time', 'checkout_time', 'latitude', 'longitude', 'photo_url'
    # ASSUMPTION: You have a 'Sales Activity Log' DocType to record activities

    try:
        doc = frappe.get_doc("Sales Visit Plan", name)
        doc.status = new_status

        if new_status == "Check-in":
            doc.checkin_time = now_datetime()
            # Log activity
            frappe.get_doc({
                "doctype": "Sales Activity Log", # ASSUMPTION: DocType name
                "activity_type": "Check-in",
                "sales_visit_plan": name,
                "activity_time": now_datetime(),
                "sales_person": doc.sales_person, # ASSUMPTION: sales_person field exists
                "customer": doc.customer # ASSUMPTION: customer field exists
            }).insert(ignore_permissions=True)

        elif new_status == "Selesai":
            doc.checkout_time = now_datetime()
            doc.latitude = latitude
            doc.longitude = longitude
            doc.photo_url = photo_url # This might need special handling for file uploads in Frappe

            # Log activity
            frappe.get_doc({
                "doctype": "Sales Activity Log", # ASSUMPTION: DocType name
                "activity_type": "Checkout",
                "sales_visit_plan": name,
                "activity_time": now_datetime(),
                "sales_person": doc.sales_person, # ASSUMPTION: sales_person field exists
                "customer": doc.customer, # ASSUMPTION: customer field exists
                "latitude": latitude,
                "longitude": longitude,
                "photo_url": photo_url
            }).insert(ignore_permissions=True)

        doc.save(ignore_permissions=True)
        frappe.db.commit()
        return "Success"
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Error in update_sales_visit_plan_status")
        frappe.throw(f"Failed to update sales visit plan status: {e}")

@frappe.whitelist()
def get_order_history(store_name):
    # ASSUMPTION: Your Sales Order DocType is named 'Sales Order'
    # ASSUMPTION: It has a field like 'customer_name' that matches store_name
    # ASSUMPTION: It has fields like 'name' (for order_id), 'transaction_date', 'grand_total'

    try:
        orders = frappe.db.get_list(
            "Sales Order", # ASSUMPTION: DocType name
            filters={
                "customer_name": store_name # ASSUMPTION: field name
            },
            fields=[
                "name as order_id",
                "transaction_date as date", # ASSUMPTION: field name
                "grand_total as total" # ASSUMPTION: field name
            ],
            order_by="transaction_date desc",
            limit=5, # Limit to last 5 orders for example
            as_dict=True
        )
        return orders
    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Error in get_order_history")
        frappe.throw(f"Failed to fetch order history: {e}")