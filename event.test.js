require("dotenv").config();
const request = require("supertest");
const app = require("./index");


let token;

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

describe("Event Management", () => {
    it("should create an event", async () => {
        const res = await request(app)
            .post("/events")
            .set("Authorization", `Bearer ${token}`) // Fix here
            .send({
                name: "Test Event",
                description: "This is a test event",
                date: new Date().toISOString(),
                category: "Meeting",
                reminderTime: new Date().toISOString()
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe("Test Event");
    });

    it("should fetch all events", async () => {
        const res = await request(app)
            .get("/events")
            .set("Authorization", `Bearer ${token}`); // Fix here

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBeGreaterThan(0);
    });
});
