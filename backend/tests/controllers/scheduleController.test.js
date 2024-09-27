const request = require("supertest");
const express = require("express");
const scheduleController = require("../../controllers/scheduleController");
const scheduleService = require("../../services/scheduleService");

const app = express();
app.use(express.json());

app.post("/schedule", scheduleController.createSchedule);
app.get(
  "/schedule/global/:departmentname",
  scheduleController.getScheduleGlobal
);
app.get("/schedule/department", scheduleController.getScheduleByDepartment);
app.get("/schedule/team", scheduleController.getScheduleByTeam);
app.get("/schedule/personal", scheduleController.getSchedulePersonal);

jest.mock("../../services/scheduleService");

describe("Schedule Controller", () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { staff_id: "test-staff-id" },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("createSchedule", () => {
    it("should create a schedule and return 201 status", async () => {
      const scheduleData = { id: 1, name: "Test Schedule" };
      scheduleService.createSchedule.mockResolvedValue(scheduleData);

      await scheduleController.createSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(scheduleData);
    });

    it("should return 400 status on error", async () => {
      const errorMessage = "Error creating schedule";
      scheduleService.createSchedule.mockRejectedValue(new Error(errorMessage));

      await scheduleController.createSchedule(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe("getScheduleGlobal", () => {
    it("should get global schedules and return 200 status", async () => {
      const schedules = [{ id: 1, name: "Global Schedule" }];
      scheduleService.getScheduleGlobal.mockResolvedValue(schedules);

      req.params.departmentname = "IT";
      req.query = {
        position: "Manager",
        start_date: "2023-01-01",
        end_date: "2023-12-31",
      };

      await scheduleController.getScheduleGlobal(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(schedules);
    });

    it("should return 400 status on error", async () => {
      const errorMessage = "Error getting global schedules";
      scheduleService.getScheduleGlobal.mockRejectedValue(
        new Error(errorMessage)
      );

      await scheduleController.getScheduleGlobal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe("getScheduleByDepartment", () => {
    it("should get department schedules and return 200 status", async () => {
      const schedules = [{ id: 1, name: "Department Schedule" }];
      scheduleService.getScheduleByDepartment.mockResolvedValue(schedules);

      req.query = { start_date: "2023-01-01", end_date: "2023-12-31" };

      await scheduleController.getScheduleByDepartment(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(schedules);
    });

    it("should return 400 status on error", async () => {
      const errorMessage = "Error getting department schedules";
      scheduleService.getScheduleByDepartment.mockRejectedValue(
        new Error(errorMessage)
      );

      await scheduleController.getScheduleByDepartment(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe("getScheduleByTeam", () => {
    it("should get team schedules and return 200 status", async () => {
      const schedules = [{ id: 1, name: "Team Schedule" }];
      scheduleService.getScheduleByTeam.mockResolvedValue(schedules);

      req.query = { start_date: "2023-01-01", end_date: "2023-12-31" };

      await scheduleController.getScheduleByTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(schedules);
    });

    it("should return 400 status on error", async () => {
      const errorMessage = "Error getting team schedules";
      scheduleService.getScheduleByTeam.mockRejectedValue(
        new Error(errorMessage)
      );

      await scheduleController.getScheduleByTeam(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe("getSchedulePersonal", () => {
    it("should get personal schedules and return 200 status", async () => {
      const schedules = [{ id: 1, name: "Personal Schedule" }];
      scheduleService.getSchedulePersonal.mockResolvedValue(schedules);

      req.query = { start_date: "2023-01-01", end_date: "2023-12-31" };

      await scheduleController.getSchedulePersonal(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(schedules);
    });

    it("should return 400 status on error", async () => {
      const errorMessage = "Error getting personal schedules";
      scheduleService.getSchedulePersonal.mockRejectedValue(
        new Error(errorMessage)
      );

      await scheduleController.getSchedulePersonal(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});
