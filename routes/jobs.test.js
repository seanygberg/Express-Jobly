"use strict";

const request = require("supertest");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("POST /jobs", function () {
    const newJob = {
        companyHandle: "c1",
        title: "J-new",
        salary: 10,
        equity: "0.2",
    };

    test("ok for admin", async function () {
        const resp = await request(app)
            .post(`/jobs`)
            .send(newJob)
            .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({
            job: {
                id: expect.any(Number),
                title: "J-new",
                salary: 10,
                equity: "0.2",
                companyHandle: "c1",
            },
        });
    });

    test("unauth for non-admin", async function () {
        const resp = await request(app)
            .post(`/jobs`)
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    })
});

describe("GET /jobs", function () {
    test("ok for anyone", async function () {
      const resp = await request(app).get(`/jobs`);
      expect(resp.body).toEqual({
            jobs: [
              {
                id: expect.any(Number),
                title: "J1",
                salary: 1,
                equity: "0.1",
                companyHandle: "c1",
                companyName: "C1",
              },
              {
                id: expect.any(Number),
                title: "J2",
                salary: 2,
                equity: "0.2",
                companyHandle: "c1",
                companyName: "C1",
              },
              {
                id: expect.any(Number),
                title: "J3",
                salary: 3,
                equity: null,
                companyHandle: "c1",
                companyName: "C1",
              },
            ],
          },
      );
    });
});

describe("GET /jobs/:id", function () {
    test("ok for anyone", async function () {
        const resp = await request(app).get(`/jobs/${testJobIds[0]}`);
        expect(resp.body).toEqual({
            job: {
                id: testJobIds[0],
                title: "J1",
                salary: 1,
                equity: "0.1",
                company: {
                  handle: "c1",
                  name: "C1",
                  description: "Desc1",
                  numEmployees: 1,
                  logoUrl: "http://c1.img",
                },
              },
        });
    });
});

describe("PATCH /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: "J-New",
        })
        .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            job: {
              id: expect.any(Number),
              title: "J-New",
              salary: 1,
              equity: "0.1",
              companyHandle: "c1",
            },
        });
    });

    test("unauth for non-admin", async function () {
        const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          title: "J-New",
        })
        .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });
});

describe("DELETE /jobs/:id", function () {
    test("works for admin", async function () {
        const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${adminToken}`);
        expect(resp.statusCode).toEqual(200);
        expect(resp.body).toEqual({
            deleted: testJobIds[0]
        });
    });

    test("unauth for non-admin", async function () {
        const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
    });
});