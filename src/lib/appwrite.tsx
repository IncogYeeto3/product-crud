"use client"

import { Client, Databases, Query, ID } from "appwrite";
const client = new Client()
.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);
const databases = new Databases(client);
export { client, databases, Query, ID };   