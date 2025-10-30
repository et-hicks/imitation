import { NextResponse } from "next/server";

export const runtime = "nodejs";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Application API",
    version: "1.0.0",
    description:
      "Authentication endpoints backed by an encrypted SQLite credential store.",
  },
  servers: [{ url: "/" }],
  paths: {
    "/api/auth/signup": {
      post: {
        summary: "Create a new user",
        description: "Registers a new account using a username and password.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", example: "user@example.com" },
                  password: { type: "string", minLength: 8, example: "StrongPass123" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Account created successfully.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    user: {
                      type: "object",
                      nullable: true,
                      properties: {
                        id: { type: "integer" },
                        username: { type: "string" },
                        created_at: { type: "string", format: "date-time" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          409: { $ref: "#/components/responses/Conflict" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Authenticate a user",
        description:
          "Validates credentials and returns a session cookie when authentication succeeds.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string", example: "user@example.com" },
                  password: { type: "string", example: "StrongPass123" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Login successful.",
            headers: {
              "Set-Cookie": {
                description: "HTTP-only session cookie.",
                schema: { type: "string" },
              },
            },
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    user: {
                      type: "object",
                      properties: {
                        id: { type: "integer" },
                        username: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { $ref: "#/components/responses/ValidationError" },
          401: { $ref: "#/components/responses/Unauthorized" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        summary: "End the current session",
        responses: {
          200: {
            description: "Session cleared.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/auth/session": {
      get: {
        summary: "Retrieve session details",
        responses: {
          200: {
            description: "Current session information.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: {
                      oneOf: [
                        {
                          type: "object",
                          properties: {
                            id: { type: "integer" },
                            username: { type: "string" },
                          },
                        },
                        { type: "null" },
                      ],
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    responses: {
      ValidationError: {
        description: "The request could not be validated.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: { type: "string" },
              },
            },
          },
        },
      },
      Unauthorized: {
        description: "Credentials were missing or invalid.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: { type: "string" },
              },
            },
          },
        },
      },
      Conflict: {
        description: "A resource with the provided identifier already exists.",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                error: { type: "string" },
              },
            },
          },
        },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
