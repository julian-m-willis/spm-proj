import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SchedulePage from "./page";
import { useSession } from "next-auth/react";
import axios from "axios";
import dayjs from "dayjs";

jest.mock("next-auth/react");
jest.mock("axios");

describe("SchedulePage", () => {
    const mockSession = {
        user: {
            token: "mock-token",
        },
    };

    beforeEach(() => {
        useSession.mockReturnValue({ data: mockSession });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("renders without crashing", () => {
        render(<SchedulePage />);
        expect(screen.getByText("Select Department")).toBeInTheDocument();
    });

    it("fetches schedules on date change", async () => {
        const mockSchedules = {
            "2023-10-10": {
                "HR": {
                    "Manager": {
                        "In office": ["Alice"],
                        "Work from home": ["Bob"],
                    },
                },
            },
        };

        axios.get.mockResolvedValueOnce({ data: mockSchedules });

        render(<SchedulePage />);

        const dateInput = screen.getByLabelText(/date/i);
        fireEvent.change(dateInput, { target: { value: "2023-10-10" } });

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
        expect(screen.getByText("HR Department")).toBeInTheDocument();
    });

    it("displays loading spinner while fetching schedules", async () => {
        axios.get.mockImplementationOnce(() => new Promise((resolve) => setTimeout(() => resolve({ data: {} }), 1000)));

        render(<SchedulePage />);

        const dateInput = screen.getByLabelText(/date/i);
        fireEvent.change(dateInput, { target: { value: "2023-10-10" } });

        expect(screen.getByRole("progressbar")).toBeInTheDocument();
        await waitFor(() => expect(screen.queryByRole("progressbar")).not.toBeInTheDocument());
    });

    it("filters schedules by department and role", async () => {
        const mockSchedules = {
            "2023-10-10": {
                "HR": {
                    "Manager": {
                        "In office": ["Alice"],
                        "Work from home": ["Bob"],
                    },
                    "Developer": {
                        "In office": ["Charlie"],
                        "Work from home": ["Dave"],
                    },
                },
                "IT": {
                    "Support": {
                        "In office": ["Eve"],
                        "Work from home": ["Frank"],
                    },
                },
            },
        };

        axios.get.mockResolvedValueOnce({ data: mockSchedules });

        render(<SchedulePage />);

        const dateInput = screen.getByLabelText(/date/i);
        fireEvent.change(dateInput, { target: { value: "2023-10-10" } });

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));

        const departmentSelect = screen.getByLabelText(/select department/i);
        fireEvent.mouseDown(departmentSelect);
        fireEvent.click(screen.getByText("HR"));

        const roleSelect = screen.getByLabelText(/select role/i);
        fireEvent.mouseDown(roleSelect);
        fireEvent.click(screen.getByText("Manager"));

        expect(screen.getByText("Alice")).toBeInTheDocument();
        expect(screen.getByText("Bob")).toBeInTheDocument();
        expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
    });

    it("displays no schedules message when no schedules are available", async () => {
        axios.get.mockResolvedValueOnce({ data: {} });

        render(<SchedulePage />);

        const dateInput = screen.getByLabelText(/date/i);
        fireEvent.change(dateInput, { target: { value: "2023-10-10" } });

        await waitFor(() => expect(axios.get).toHaveBeenCalledTimes(1));
        expect(screen.getByText("No schedules available for this date.")).toBeInTheDocument();
    });
});