import { levenshteinDistance } from "@/lib/levenshtein";

describe("levenshteinDistance", () => {
  it("should return 0 for identical strings", () => {
    expect(levenshteinDistance("hello", "hello")).toBe(0);
    expect(levenshteinDistance("", "")).toBe(0);
  });

  it("should return length of non-empty string when other is empty", () => {
    expect(levenshteinDistance("hello", "")).toBe(5);
    expect(levenshteinDistance("", "world")).toBe(5);
  });

  it("should calculate single character changes correctly", () => {
    expect(levenshteinDistance("cat", "car")).toBe(1);
    expect(levenshteinDistance("cat", "cats")).toBe(1);
    expect(levenshteinDistance("cats", "cat")).toBe(1);
  });

  it("should handle multiple changes", () => {
    expect(levenshteinDistance("kitten", "sitting")).toBe(3);
    expect(levenshteinDistance("saturday", "sunday")).toBe(3);
  });

  it("should be symmetric", () => {
    expect(levenshteinDistance("abc", "def")).toBe(
      levenshteinDistance("def", "abc")
    );
  });

  it("should handle the Javl -> Jack case from requirements", () => {
    expect(levenshteinDistance("javl", "jack")).toBe(2);
  });
});
