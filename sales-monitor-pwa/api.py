
import frappe

@frappe.whitelist(allow_guest=True)
def login(usr, pwd):
    try:
        frappe.login(usr=usr, pwd=pwd)
        # Check if the user has the required role
        if "Sales User" not in frappe.get_roles():
            frappe.logout()
            return {"status": "error", "message": "User is not a Sales User."}
        
        # Return session information and user details
        return {
            "status": "success",
            "sid": frappe.session.sid,
            "user_id": frappe.session.user,
            "full_name": frappe.session.user_full_name
        }
    except frappe.exceptions.AuthenticationError:
        return {"status": "error", "message": "Invalid login credentials."}

@frappe.whitelist()
def update_activity_from_pwa(activity_log_id, latitude, longitude, photo_url):
    """
    Updates the Sales Activity Log with data from the PWA.
    """
    try:
        # The photo_url is expected to be a base64 encoded string from the PWA
        # Frappe's Attach Image field can handle it
        
        activity_log = frappe.get_doc("Sales Activity Log", activity_log_id)
        
        # Determine if this is a check-in or check-out based on existing data
        if not activity_log.check_in_photo:
            # This is a Check-in
            activity_log.check_in_time = frappe.utils.now_datetime()
            activity_log.actual_location_latitude = latitude
            activity_log.actual_location_longitude = longitude
            activity_log.check_in_photo = photo_url
            
            # Update the status of the linked Sales Visit Plan
            visit_plan = frappe.get_doc("Sales Visit Plan", activity_log.sales_visit_plan)
            visit_plan.status = "Checked In"
            visit_plan.save()

        else:
            # This is a Check-out
            activity_log.check_out_time = frappe.utils.now_datetime()
            activity_log.check_out_photo = photo_url
            
            # Update the status of the linked Sales Visit Plan
            visit_plan = frappe.get_doc("Sales Visit Plan", activity_log.sales_visit_plan)
            visit_plan.status = "Completed"
            # 'on_submit' logic will be triggered if the doctype is submittable
            # Since we are doing it via API, we might need to manually trigger it if needed
            # For now, just saving is enough to reflect the state.
            visit_plan.save()

        activity_log.save(ignore_permissions=True)
        frappe.db.commit()
        
        return {"status": "success", "message": f"Activity {activity_log_id} updated."}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "PWA Activity Update Error")
        return {"status": "error", "message": str(e)}

