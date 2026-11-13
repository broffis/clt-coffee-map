import type {
  DocumentCollection,
  MongoDatabase,
} from "../src/persistence/mongo-repositories";

type Doc = Record<string, unknown> & { _id: string };

function matches(doc: Doc, filter: Record<string, unknown>): boolean {
  return Object.entries(filter).every(([key, expected]) => {
    const actual = doc[key];
    if (typeof expected === "object" && expected !== null) {
      const operators = expected as { $ne?: unknown; $in?: unknown[] };
      if ("$ne" in operators) {
        return actual !== operators.$ne;
      }
      if ("$in" in operators) {
        return (operators.$in ?? []).includes(actual);
      }
    }
    return actual === expected;
  });
}

export class FakeCollection implements DocumentCollection<Doc> {
  readonly documents: Doc[] = [];
  readonly indexes: Record<string, 1 | -1>[] = [];
  failWith: Error | null = null;

  private check(): void {
    if (this.failWith !== null) {
      throw this.failWith;
    }
  }

  async findOne(filter: Record<string, unknown>) {
    this.check();
    const found = this.documents.find((doc) => matches(doc, filter));
    return found === undefined ? null : structuredClone(found);
  }

  find(filter: Record<string, unknown>) {
    return {
      toArray: async () => {
        this.check();
        return this.documents
          .filter((doc) => matches(doc, filter))
          .sort((a, b) => a._id.localeCompare(b._id))
          .map((doc) => structuredClone(doc));
      },
    };
  }

  async countDocuments(filter: Record<string, unknown>) {
    this.check();
    return this.documents.filter((doc) => matches(doc, filter)).length;
  }

  async replaceOne(
    filter: Record<string, unknown>,
    replacement: Omit<Doc, "_id">,
    _options: { upsert: true },
  ) {
    this.check();
    const index = this.documents.findIndex((doc) => matches(doc, filter));
    if (index >= 0) {
      const { _id } = this.documents[index] as Doc;
      this.documents[index] = structuredClone({ ...replacement, _id });
      return;
    }
    // Like the server, an upsert seeds the new document from the filter's equality fields.
    const inserted = { ...filter, ...replacement } as Doc;
    if (this.documents.some((doc) => doc._id === inserted._id)) {
      throw Object.assign(new Error("E11000 duplicate key"), { code: 11000 });
    }
    this.documents.push(structuredClone(inserted));
  }

  async deleteOne(filter: Record<string, unknown>) {
    this.check();
    const index = this.documents.findIndex((doc) => matches(doc, filter));
    if (index >= 0) {
      this.documents.splice(index, 1);
    }
    return { deletedCount: index >= 0 ? 1 : 0 };
  }

  async createIndex(spec: Record<string, 1 | -1>) {
    this.check();
    this.indexes.push(spec);
    return "index";
  }
}

export function createFakeDatabase(): MongoDatabase & {
  readonly collections: Map<string, FakeCollection>;
} {
  const collections = new Map<string, FakeCollection>();

  return {
    collections,
    collection(name: string) {
      let collection = collections.get(name);
      if (collection === undefined) {
        collection = new FakeCollection();
        collections.set(name, collection);
      }
      return collection as unknown as DocumentCollection<never>;
    },
  } as MongoDatabase & { readonly collections: Map<string, FakeCollection> };
}
