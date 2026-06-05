const axios = require("axios");

// Configuration
const API_URL = process.env.API_URL || "https://citizenvoice-backend.onrender.com/api";
const CITIZEN1_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMjBhNDQ2YzIzZjBjZGFjMDgwN2ViZSIsInJvbGUiOiJjaXRpemVuIiwicmVnaW9uIjoiR2FtYmVsYSIsInZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3ODA1MjQyMTAsImV4cCI6MTc4MTEyOTAxMH0.UT-bTQM3QUlJlxIsjWkWat6qD8hkI4bnHCqzZh5iU20";

async function testNotificationsAPI() {
  try {
    console.log("Testing Notifications API...\n");
    console.log(`API URL: ${API_URL}`);
    console.log(`Using citizen1@test.com token\n`);

    // Test 1: Get all notifications
    console.log("1. Fetching all notifications...");
    const allNotifications = await axios.get(`${API_URL}/users/me/notifications`, {
      headers: { Authorization: `Bearer ${CITIZEN1_TOKEN}` },
    });
    
    console.log(`   Status: ${allNotifications.status}`);
    console.log(`   Total notifications: ${allNotifications.data.data.total}`);
    console.log(`   Returned: ${allNotifications.data.data.notifications.length}`);
    
    if (allNotifications.data.data.notifications.length > 0) {
      const firstNotif = allNotifications.data.data.notifications[0];
      console.log(`   First notification:`);
      console.log(`      Type: ${firstNotif.type}`);
      console.log(`      Title: ${firstNotif.title}`);
      console.log(`      Message: ${firstNotif.message}`);
      console.log(`      Read: ${firstNotif.read}`);
      console.log(`      Created: ${firstNotif.createdAt}`);
    }
    console.log("");

    // Test 2: Get unread notifications only
    console.log("2. Fetching unread notifications only...");
    const unreadNotifications = await axios.get(
      `${API_URL}/users/me/notifications?unreadOnly=true`,
      {
        headers: { Authorization: `Bearer ${CITIZEN1_TOKEN}` },
      },
    );
    
    console.log(`   Status: ${unreadNotifications.status}`);
    console.log(`   Unread notifications: ${unreadNotifications.data.data.notifications.length}`);
    console.log("");

    // Test 3: Mark one notification as read (if we have any)
    if (allNotifications.data.data.notifications.length > 0) {
      const firstNotifId = allNotifications.data.data.notifications[0]._id;
      console.log(`3. Marking notification ${firstNotifId} as read...`);
      
      const markRead = await axios.patch(
        `${API_URL}/users/me/notifications/${firstNotifId}/read`,
        {},
        {
          headers: { Authorization: `Bearer ${CITIZEN1_TOKEN}` },
        },
      );
      
      console.log(`   Status: ${markRead.status}`);
      console.log(`   Notification marked as read: ${markRead.data.data.read}`);
      console.log("");
    }

    console.log("✅ All notification API tests passed!\n");
    
    // Summary
    console.log("========== SUMMARY ==========");
    console.log(`Total notifications for citizen1: ${allNotifications.data.data.total}`);
    console.log(`Unread count: ${unreadNotifications.data.data.notifications.length}`);
    console.log("============================\n");

  } catch (error) {
    console.error("❌ Error testing notifications API:");
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(`   Error: ${error.message}`);
    }
    process.exit(1);
  }
}

testNotificationsAPI();
