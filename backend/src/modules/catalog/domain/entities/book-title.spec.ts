import { BookTitle } from "./book-title";
import { BookCopyStatus } from "../enums/book-copy-status.enum";

describe("BookTitle", () => {
  it("counts only available copies and groups them by branch", () => {
    const book = BookTitle.restore({
      id: "title-1",
      title: "Clean Architecture",
      isbn: "9780134494166",
      authors: ["Robert C. Martin"],
      subjects: ["Software design"],
      publisher: "Pearson",
      copies: [
        { id: "copy-1", branchId: "branch-a", status: BookCopyStatus.AVAILABLE },
        { id: "copy-2", branchId: "branch-a", status: BookCopyStatus.ON_LOAN },
        { id: "copy-3", branchId: "branch-b", status: BookCopyStatus.AVAILABLE },
      ],
    });

    expect(book.availability()).toEqual([
      { branchId: "branch-a", availableCopies: 1 },
      { branchId: "branch-b", availableCopies: 1 },
    ]);
  });

  it("rejects a title without a name", () => {
    expect(() =>
      BookTitle.restore({
        id: "title-1",
        title: "   ",
        isbn: null,
        authors: [],
        subjects: [],
        publisher: null,
        copies: [],
      }),
    ).toThrow("Book title must not be empty");
  });
});
