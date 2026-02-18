import { readFile } from "fs/promises";
import path from "path";
import { Subject, SearchOptions, ImageResult } from "./types";
import { levenshteinDistance } from "./levenshtein";

class TrieNode {
  children: Map<string, TrieNode> = new Map();
  rowRefs: Set<Subject> = new Set();
}

export class DataService {
  private rows: Subject[] = [];
  private nameIndex: Map<string, Set<Subject>> = new Map();
  private idIndex: Map<number, Subject> = new Map();
  private trieRoot: TrieNode = new TrieNode();
  private loaded: boolean = false;

  async loadCSV(filepath: string): Promise<Subject[]> {
    const csvString = await readFile(filepath, { encoding: "utf-8" });
    const lines = csvString.trim().split("\n");

    if (lines.length < 2) {
      throw new Error("Invalid CSV: No data rows available.");
    }

    const headers = lines[0].split(",").map((h) => h.trim());

    const result = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      return headers.reduce((acc, header, index) => {
        acc[header] = values[index];
        return acc;
      }, {} as Record<string, string>);
    });

    this.rows = result.map((r) => ({
      id: Number(r.id),
      name: r.name,
      image_id: r.image_id,
    }));

    this.buildIndexes();
    this.loaded = true;
    return this.rows;
  }

  getImagesBySubjectIDs(subjectIDs: number[]): ImageResult[] {
    if (!this.rows.length) {
      throw new Error("No data loaded. Please load a CSV first.");
    }

    const idsSet = new Set(subjectIDs);

    return this.rows
      .filter((row) => idsSet.has(row.id))
      .map((row) => ({ id: row.id, image_id: row.image_id }));
  }

  searchByName(query: string, options: SearchOptions = { limit: 10 }): Subject[] {
    const normalizedQuery = query.toLowerCase();
    const results = new Set<Subject>();
    const limit = options.limit ?? 10;

    const prefixMatches = this.searchInTrie(normalizedQuery);
    for (const row of prefixMatches) {
      if (limit > 0 && results.size >= limit) break;
      results.add(row);
    }

    if (limit > 0 && results.size >= limit) {
      return Array.from(results);
    }

    for (const [token, rows] of this.nameIndex) {
      const normalizedToken = token.toLowerCase();
      if (levenshteinDistance(normalizedToken, normalizedQuery) <= 2) {
        for (const row of rows) {
          if (limit > 0 && results.size >= limit) break;
          results.add(row);
        }
      }
      if (limit > 0 && results.size >= limit) break;
    }

    return Array.from(results);
  }

  getAllSubjects(): Subject[] {
    return [...this.rows];
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  private buildIndexes(): void {
    this.nameIndex.clear();
    this.idIndex.clear();
    this.trieRoot = new TrieNode();

    for (const row of this.rows) {
      this.idIndex.set(row.id, row);

      const tokens = row.name.split(/\s+/);
      for (const token of tokens) {
        const lowerToken = token.toLowerCase();

        if (!this.nameIndex.has(lowerToken)) {
          this.nameIndex.set(lowerToken, new Set());
        }
        this.nameIndex.get(lowerToken)!.add(row);

        this.insertIntoTrie(lowerToken, row);
      }
    }
  }

  private insertIntoTrie(token: string, row: Subject): void {
    let node = this.trieRoot;
    for (const char of token) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
      node.rowRefs.add(row);
    }
  }

  private searchInTrie(prefix: string): Subject[] {
    let node = this.trieRoot;
    for (const char of prefix) {
      if (!node.children.has(char)) {
        return [];
      }
      node = node.children.get(char)!;
    }
    return Array.from(node.rowRefs);
  }
}

let serviceInstance: DataService | null = null;

export async function getDataService(): Promise<DataService> {
  if (!serviceInstance) {
    serviceInstance = new DataService();
    const csvPath = path.join(process.cwd(), "public", "subject_images.csv");
    await serviceInstance.loadCSV(csvPath);
  }
  return serviceInstance;
}
