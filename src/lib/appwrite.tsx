"use client"

import { Client, Databases, Query, ID, Account, Teams } from "appwrite";
const client = new Client()
.setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
.setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);
const databases = new Databases(client);
const account = new Account(client)
const teams = new Teams(client);

// Optional: export IDs if you want
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID = process.env.NEXT_PUBLIC_APPWRITE_TABLE_ID!;

export { client, databases, account, teams, ID, DATABASE_ID, COLLECTION_ID };
