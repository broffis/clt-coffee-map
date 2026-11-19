import type { ShopCandidate } from "../domain/candidates";
import { validateCandidate } from "../domain/candidates";
import type { CandidateRepository } from "./candidate-repository";
import { checkIdentifier } from "./checks";
import { PersistenceError } from "./errors";
import {
  type DocumentCollection,
  type MongoDatabase,
  run as runDatabaseOperation,
} from "./mongo-repositories";

type CandidateDocument = Omit<ShopCandidate, "id"> & { _id: string };

function toCandidate(document: CandidateDocument): ShopCandidate {
  const { _id, ...fields } = document;
  const candidate = { ...fields, id: _id };
  try {
    validateCandidate(candidate);
    return candidate;
  } catch {
    throw new PersistenceError(
      "validation",
      "Stored candidate record is invalid.",
    );
  }
}

export function createMongoCandidateRepository(
  database: MongoDatabase,
): CandidateRepository {
  const collection = database.collection<CandidateDocument>(
    "shopCandidates",
  ) as DocumentCollection<CandidateDocument>;

  return {
    get: (id) =>
      runDatabaseOperation(async () => {
        checkIdentifier(id, "Candidate ID");
        const document = await collection.findOne({ _id: id });
        return document === null ? null : toCandidate(document);
      }),
    listPending: () =>
      runDatabaseOperation(async () =>
        (await collection.find({ status: "pending" }).toArray())
          .map(toCandidate)
          .sort((left, right) => left.id.localeCompare(right.id)),
      ),
    save: (candidate) =>
      runDatabaseOperation(async () => {
        validateCandidate(candidate);
        await collection.replaceOne(
          { _id: candidate.id },
          {
            source: candidate.source,
            sourceRecordId: candidate.sourceRecordId,
            release: candidate.release,
            name: candidate.name,
            type: candidate.type,
            address: candidate.address,
            coordinates: candidate.coordinates,
            website: candidate.website,
            importedAt: candidate.importedAt,
            status: candidate.status,
            reviewedBy: candidate.reviewedBy,
            reviewedAt: candidate.reviewedAt,
          },
          { upsert: true },
        );
      }),
  };
}
