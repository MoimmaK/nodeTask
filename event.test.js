require("dotenv").config();
const request = require("supertest");
const app = require("./index");
const cron = require("node-cron");

let server;
let token;

beforeAll(() => {
    server = app.listen(5000); // Start the server before tests
});

afterAll(() => {
    // Stop all scheduled cron jobs
    cron.getTasks().forEach(task => task.stop());

    // Close the server after tests
    server.close();
});

describe("User Authentication", () => {
    it("should register a new user", async () => {
        const res = await request(app).post("/register").send({
            username: "kiki",
            email: "kiki@example.com",
            password: "password123"
        });
        expect(res.statusCode).toBe(201);
    });

    it("should login the user and return a token", async () => {
        const res = await request(app).post("/login").send({
            email: "kiki@example.com",
            password: "password123"
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.token).toBeDefined();
        token = res.body.token;
    });
});
