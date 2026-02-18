import { render, screen } from "@testing-library/react";
import SubjectCard from "@/components/SubjectCard";

describe("SubjectCard", () => {
  const mockSubject = {
    id: 1,
    name: "Test User",
    image_id: "img_001.jpg",
  };

  it("renders subject information correctly", () => {
    render(<SubjectCard subject={mockSubject} />);

    expect(screen.getByText("ID: 1")).toBeInTheDocument();
    expect(screen.getByText("Test User")).toBeInTheDocument();
    expect(screen.getByText("img_001.jpg")).toBeInTheDocument();
  });

  it("displays the name as a heading", () => {
    render(<SubjectCard subject={mockSubject} />);

    const heading = screen.getByRole("heading", { level: 3 });
    expect(heading).toHaveTextContent("Test User");
  });
});
