import asyncHandler from "express-async-handler";

// GCP SDK API
import { ProjectsClient, FoldersClient } from "@google-cloud/resource-manager";
import { OrgPolicyClient } from "@google-cloud/org-policy";
import { GoogleAuth } from "google-auth-library";
import fetch from "node-fetch";

// import { CloudBillingClient } from "@google-cloud/billing";
// import { BigQuery } from "@google-cloud/bigquery";
// import { PoliciesClient } from "@google-cloud/iam";

// GCP CODE
// const createGCPEnvironments = asyncHandler((req, res) => {
//   const { environs, parent, orgCode, appCode, cloudCredentials } = req;

//   // const projectId = displayName.toLowerCase();
//   // // const project = projectId;
//   // console.log(`Creating GCP App ${projectId}`);

//   const client = new ProjectsClient();

//   let project;
//   let environments = [];
//   environs.map(async (env) => {
//     let projectId = `bp-${orgCode.split("-")[0]}-${appCode.split("-")[0]}`;
//     project = {
//       projectId,
//       displayName: `bp-${orgCode.split("-")[0]}-${
//         appCode.split("-")[0]
//       }-${env}`,
//       parent,
//     };

//     const request = {
//       project,
//     };

//     console.log("Project Object:", project);
//     console.log("POST Request Body:", request);

//     // Run request
//     const [operation] = await client.createProject(request);
//     const [response] = await operation.promise();
//     console.log(response);
//     // return response;
//     environments.push(response);
//   });

//   return environments;
//   //
// });

// const createGCPEnvironments = asyncHandler(async (req, res) => {
//   const { environs, parent, orgCode, appCode, cloudCredentials } = req;
//   const creds = JSON.parse(cloudCredentials);

//   // Create a new JWT client
//   const client = new JWT({
//     email: creds.gcpsecret.client_email,
//     key: creds.gcpsecret.private_key,
//     scopes: ["https://www.googleapis.com/auth/cloud-platform"],
//   });

//   // Obtain an access token
//   const accessToken = await client.getAccessToken();

//   // Create Project Environments
//   let environments = [];

//   environs.map(async (env) => {
//     // Create a new ProjectsClient with authentication
//     let projectId = `bp-${orgCode.split("-")[0]}-${appCode.split("-")[0]}`;
//     const projectsClient = new ProjectsClient({
//       projectId,
//       credentials: {
//         access_token: accessToken,
//       },
//     });

//     // Define the project creation request

//     let p = {
//       project: {
//         name: `bp-${orgCode.split("-")[0]}-${appCode.split("-")[0]}-${env}`,
//         projectId,
//         parent: {
//           id: `${parent.split("/")[1]}`,
//         },
//       },
//     };

//     console.log(p);
//     const [response] = await projectsClient.createProject(p);
//     console.log("iam here");
//     console.log("RESPONSE", response);
//     return;

//     // const [response] = await projectClient.create({
//     //   project: {
//     //     name: `bp-${orgCode.split("-")[0]}-${appCode.split("-")[0]}-${env}`,
//     //     projectId,
//     //     parent: {
//     //       type: "folder",
//     //       id: parent,
//     //     },
//     //   },
//     // });

//     console.log(`project created: ${response.project.name}`);

//     // return response;
//     environments.push(response);
//   });

//   return environments;
// });

async function listProjects(credentials) {
  const creds = JSON.parse(credentials);
  try {
    // Create a new GoogleAuth instance
    const auth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });

    // Create a JWT client with the provided credentials
    const jwtClient = await auth.fromJSON({
      client_email: creds.gcpsecret.client_email,
      private_key: creds.gcpsecret.private_key,
    });

    // Obtain an access token
    const accessToken = await jwtClient.getAccessToken();

    // Make a request to list projects using the access token
    const response = await fetch(
      "https://cloudresourcemanager.googleapis.com/v1/projects",
      {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();

    // Log the list of projects
    console.log("Projects:");
    data.projects.forEach((project) => {
      console.log(project.name);
    });
  } catch (err) {
    console.error("Error listing projects:", err);
  }
}

async function createProject(client_email, private_key, parent, projectId) {
  try {
    // Create a new GoogleAuth instance
    const auth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });

    // Create a JWT client with the provided credentials
    const jwtClient = await auth.fromJSON({
      client_email,
      private_key,
    });
    // console.log("client_email", client_email);
    // console.log("private_key", private_key);

    // Obtain an access token
    const accessToken = await jwtClient.getAccessToken();
    // console.log(accessToken);

    // Create the project request body
    const requestBody = {
      projectId,
      name: projectId,
      parent: {
        type: "organization", // Change this to 'folder' or 'organization' depending on your needs
        id: `${parent.split("/")[1]}`, // Replace with your organization ID or folder ID
      },
    };
    // console.log(requestBody);
    // console.log(accessToken.token);

    // Make a request to create the project using the access token
    const response = await fetch(
      "https://cloudresourcemanager.googleapis.com/v1/projects",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken.token}`, // Accessing the token property
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create project: ${response.statusText}`);
    }

    const data = await response.json();

    console.log("Project created successfully:", data);
  } catch (err) {
    console.error("Error creating project:", err);
  }
}

// const createGCPEnvironments = asyncHandler(async (req, res) => {
async function createGCPEnvironments({
  environs,
  parent,
  orgCode,
  appCode,
  client_email,
  private_key,
}) {
  // const { environs, parent, orgCode, appCode, client_email, private_key } = req;

  try {
    let environments = [];

    await Promise.all(
      environs.map(async (env) => {
        let projectId = `bp-${orgCode.split("-")[0]}-${
          appCode.split("-")[0]
        }-${env}`;
        const response = await createProject(
          client_email,
          private_key,
          parent,
          projectId
        );
        // console.log(`project created: ${response.project.name}`);
        environments.push({ name: env, accountId: projectId });
      })
    );
    // console.log("environments", environments);
    return environments;
    // res.status(200).json(environments);
  } catch (error) {
    console.error("Error creating GCP environments:", error);
    // res.status(500).json({ error: "Internal Server Error" });
  }
}

async function getAccessAssignments(accessToken, projectId) {
  const url = `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId.accountId}:getIamPolicy`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching access assignments:", error);
    return null;
  }
}

async function getGCPAccess({ client_email, private_key, environments }) {
  try {
    // Create a new GoogleAuth instance
    const auth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });

    // Create a JWT client with the provided credentials
    const jwtClient = await auth.fromJSON({
      client_email,
      private_key,
    });

    // Obtain an access token
    const accessToken = await jwtClient.getAccessToken();

    let assignments = [];
    console.log(environments);

    await Promise.all(
      environments.map(async (env) => {
        const response = await getAccessAssignments(accessToken.token, env);
        assignments.push(response);
      })
    );

    return assignments;
  } catch (error) {
    console.error("Error Retrieving Access Assignments:", error);
  }
}

async function getPolicyAssignments(accessToken, projectId) {
  const url = `https://cloudresourcemanager.googleapis.com/v1/projects/${projectId}:listOrgPolicies`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching access assignments:", error);
    return null;
  }
}

async function getGCPPolicies({ client_email, private_key, environments }) {
  try {
    // Create a new GoogleAuth instance
    const auth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });

    // Create a JWT client with the provided credentials
    const jwtClient = await auth.fromJSON({
      client_email,
      private_key,
    });

    // Obtain an access token
    const accessToken = await jwtClient.getAccessToken();

    let policies = [];

    await Promise.all(
      environments.map(async (env) => {
        const response = await getPolicyAssignments(accessToken.token, env);
        policies.push(response);
      })
    );

    return policies;
  } catch (error) {
    console.error("Error Retrieving Access Assignments:", error);
  }
}

async function getGCPCost({ cloudCredentials, environments }) {
  const cost = ((Math.random() + 1) * 500).toFixed(2);
  return cost; // Simulating App Cost for MVP
}

// const getGCPPolicy = asyncHandler(async (req, res) => {
//   // TODO(developer): replace with your prefered project ID.
//   const projectId = "backplane-core"; // Need to use the App ID to retrieve the Project Name

//   // Creates a client
//   // eslint-disable-next-line no-unused-vars
//   const client = new OrgPolicyClient();

//   //TODO(library generator): write the actual function you will be testing
//   async function listConstraints() {
//     const constraints = await client.listConstraints({
//       parent: `projects/${projectId}`,
//     });
//     return constraints;
//   }
//   const policies = await listConstraints();

//   //console.log("Get GCP Policy");
//   //res.send("Get GCP Policy - Logic not yet implemented");
//   res.json(policies[0]);
// });

export { getGCPAccess, getGCPCost, getGCPPolicies, createGCPEnvironments };
