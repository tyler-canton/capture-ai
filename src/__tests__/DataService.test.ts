import path from "path";
import { DataService } from "@/lib/DataService";

describe("DataService", () => {
  let dataService: DataService;
  const csvPath = path.join(process.cwd(), "public", "subject_images.csv");

  beforeEach(async () => {
    dataService = new DataService();
    await dataService.loadCSV(csvPath);
  });

  describe("loadCSV", () => {
    it("should load and parse CSV data correctly", () => {
      const subjects = dataService.getAllSubjects();
      expect(subjects.length).toBeGreaterThan(0);
      expect(subjects[0]).toHaveProperty("id");
      expect(subjects[0]).toHaveProperty("name");
      expect(subjects[0]).toHaveProperty("image_id");
    });

    it("should convert id to number", () => {
      const subjects = dataService.getAllSubjects();
      expect(typeof subjects[0].id).toBe("number");
    });
  });

  describe("getImagesBySubjectIDs", () => {
    it("should return no results for non-existent IDs", () => {
      const imagesForNonExistentIDs = dataService.getImagesBySubjectIDs([999, 1000]);
      expect(imagesForNonExistentIDs).toEqual([]);
    });

    it("should return correct images for given subject IDs", () => {
      const images = dataService.getImagesBySubjectIDs([1, 101, 103]);
      expect(images).toEqual([
        { id: 1, image_id: "img_093.jpg" },
        { id: 101, image_id: "img_013.jpg" },
        { id: 103, image_id: "img_009.jpg" },
      ]);
    });

    it("should handle mixed valid and invalid IDs", () => {
      const images = dataService.getImagesBySubjectIDs([1, 999]);
      expect(images.length).toBe(1);
      expect(images[0].id).toBe(1);
    });

    it("should throw error if no data loaded", () => {
      const emptyService = new DataService();
      expect(() => emptyService.getImagesBySubjectIDs([1])).toThrow(
        "No data loaded. Please load a CSV first."
      );
    });
  });

  describe("searchByName", () => {
    it("should return correct images for given name query (Levenshtein match)", () => {
      const searchResult = dataService.searchByName("Javl", { limit: 1 });
      expect(searchResult).toEqual([
        {
          id: 104,
          name: "Jack",
          image_id: "img_040.jpg",
        },
      ]);
    });

    it("should find exact prefix matches", () => {
      const results = dataService.searchByName("Char", { limit: 10 });
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((r) => r.name.toLowerCase().startsWith("char"))).toBe(true);
    });

    it("should respect limit option", () => {
      const results = dataService.searchByName("a", { limit: 3 });
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it("should be case insensitive", () => {
      const lowerResults = dataService.searchByName("charlie", { limit: 5 });
      const upperResults = dataService.searchByName("CHARLIE", { limit: 5 });
      expect(lowerResults.length).toBe(upperResults.length);
    });

    it("should return empty array for no matches", () => {
      const results = dataService.searchByName("zzzzzzzzz", { limit: 10 });
      expect(results).toEqual([]);
    });
  });
});
