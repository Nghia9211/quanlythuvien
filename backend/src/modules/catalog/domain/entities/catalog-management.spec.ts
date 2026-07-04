import { BookCopy } from "./book-copy";
import { BookTitle } from "./book-title";
import { Branch, ShelfLocation } from "./library-location";
import { BookCopyStatus } from "../enums/book-copy-status.enum";

describe("Catalog management domain", () => {
  it("creates normalized book metadata with valid ISBN-13", () => {
    const book = BookTitle.create({
      id: "title-1",
      title: "  Clean Architecture ",
      isbn: "978-0-13-449416-6",
      authors: [" Robert C. Martin ", ""],
      subjects: [" Software Design "],
      publisher: " Pearson ",
    });

    expect(book.title).toBe("Clean Architecture");
    expect(book.isbn).toBe("9780134494166");
    expect(book.authors).toEqual(["Robert C. Martin"]);
    expect(book.publisher).toBe("Pearson");
  });

  it.each(["9780134494167", "0321125216", "123"])("rejects invalid ISBN %s", (isbn) => {
    expect(() =>
      BookTitle.create({
        id: "title-1",
        title: "Book",
        isbn,
        authors: ["Author"],
        subjects: [],
        publisher: null,
      }),
    ).toThrow("ISBN checksum is invalid");
  });

  it("updates bibliographic metadata without replacing copies", () => {
    const book = BookTitle.create({
      id: "title-1", title: "Old", isbn: null, authors: ["A"], subjects: [], publisher: null,
    });
    book.updateMetadata({ title: "New", authors: ["B"], subjects: ["Architecture"] });
    expect(book.title).toBe("New");
    expect(book.authors).toEqual(["B"]);
    expect(book.subjects).toEqual(["Architecture"]);
  });

  it("normalizes branch, shelf and copy identifiers", () => {
    const branch = Branch.create({ id: "branch-1", code: " hn01 ", name: " Trung tâm ", address: " Hà Nội " });
    const shelf = ShelfLocation.create({ id: "shelf-1", branchId: branch.id, code: " a-01 ", label: " Kệ A1 " });
    const copy = BookCopy.create({
      id: "copy-1", bookTitleId: "title-1", barcode: " bc-001 ", rfid: " rfid-01 ",
      branchId: branch.id, shelfLocationId: shelf.id,
    });
    expect(branch.code).toBe("HN01");
    expect(shelf.code).toBe("A-01");
    expect(copy.barcode).toBe("BC-001");
    expect(copy.status).toBe(BookCopyStatus.AVAILABLE);
  });

  it("prevents relocating a copy that is not available", () => {
    const copy = BookCopy.restore({
      id: "copy-1", bookTitleId: "title-1", barcode: "BC-001", rfid: null,
      branchId: "branch-1", shelfLocationId: "shelf-1", status: BookCopyStatus.ON_LOAN,
    });
    expect(() => copy.updateDetails({ branchId: "branch-2", shelfLocationId: "shelf-2" })).toThrow(
      "Only an available copy can change branch or shelf",
    );
  });
});
