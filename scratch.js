import dotenv from 'dotenv';
dotenv.config();

const baseUrl = process.env.KEYCLOAK_BASE_URL || "http://localhost:9000";
const realm = process.env.KEYCLOAK_REALM || "Pieq-HRMS";

async function testAdminAccess() {
  // 1. Get token from master realm
  const tokenUrl = `${baseUrl}/realms/master/protocol/openid-connect/token`;
  const params = new URLSearchParams();
  params.append("grant_type", "password");
  params.append("client_id", "admin-cli");
  params.append("username", "techadmin");
  params.append("password", "techadmin");

  console.log(`Getting token from ${tokenUrl}...`);
  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });

  if (tokenRes.status !== 200) {
    console.log("Failed to get token:", tokenRes.status);
    return;
  }

  const tokenData = await tokenRes.json();
  const token = tokenData.access_token;
  console.log("Token obtained successfully.");

  // 2. Use the token to fetch roles in the Pieq-HRMS realm
  const rolesUrl = `${baseUrl}/admin/realms/${realm}/roles`;
  console.log(`\nFetching roles from ${rolesUrl} using bearer token...`);
  
  const rolesRes = await fetch(rolesUrl, {
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  console.log(`Response Status: ${rolesRes.status}`);
  try {
    const rolesData = await rolesRes.json();
    console.log(`Found roles:`, rolesData.map(r => r.name));
  } catch (err) {
    const text = await rolesRes.text();
    console.log(`Response Text:`, text);
  }
}

testAdminAccess().catch(console.error);
