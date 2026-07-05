import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CatalogBranch, CatalogSearchItem, CatalogShelf } from "../../domain/catalog";
import { createTestServices } from "../../test/fakes";
import { ServicesProvider } from "../app/services-context";
import { CatalogPage } from "./catalog-page";

const titleId = "550e8400-e29b-41d4-a716-446655440000";
const branchId = "123e4567-e89b-42d3-a456-426614174000";
const shelfId = "123e4567-e89b-42d3-a456-426614174001";
const title: CatalogSearchItem = { id:titleId,title:"Clean Architecture",isbn:null,authors:["Robert Martin"],subjects:["Software"],publisher:null,availability:[{branchId,availableCopies:2}] };
const branch: CatalogBranch = { id:branchId,code:"MAIN",name:"Main",address:null };
const shelf: CatalogShelf = { id:shelfId,branchId,code:"A1",label:"Architecture" };

describe("CatalogPage", () => {
  it("searches, paginates, and selects a title", async () => {
    const services=createTestServices();
    vi.mocked(services.listCatalogBranches.execute).mockResolvedValue([branch]);
    vi.mocked(services.searchCatalog.execute).mockResolvedValue({items:[title],meta:{page:1,limit:20,total:21,totalPages:2}});
    render(<ServicesProvider services={services}><CatalogPage /></ServicesProvider>);
    await userEvent.type(screen.getByLabelText("Từ khóa"),"clean architecture");
    await userEvent.click(screen.getByRole("button",{name:"Tìm kiếm"}));
    expect(await screen.findByText("Clean Architecture")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button",{name:"Chọn Clean Architecture"}));
    expect(screen.getByText("Đầu sách đang chọn")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button",{name:"Trang sau"}));
    expect(services.searchCatalog.execute).toHaveBeenLastCalledWith(expect.objectContaining({page:2}));
  });

  it("creates a normalized title from the Titles tab", async () => {
    const services=createTestServices();
    vi.mocked(services.listCatalogBranches.execute).mockResolvedValue([]);
    vi.mocked(services.createCatalogTitle.execute).mockResolvedValue(title);
    render(<ServicesProvider services={services}><CatalogPage /></ServicesProvider>);
    await userEvent.click(screen.getByRole("button",{name:"Đầu sách"}));
    await userEvent.type(screen.getByLabelText("Tên sách"),"Clean Architecture");
    await userEvent.type(screen.getByLabelText("Tác giả"),"Robert Martin");
    await userEvent.type(screen.getByLabelText("Chủ đề"),"Software");
    await userEvent.click(screen.getByRole("button",{name:"Tạo đầu sách"}));
    expect(services.createCatalogTitle.execute).toHaveBeenCalledWith(expect.objectContaining({title:"Clean Architecture",authorsText:"Robert Martin"}));
    expect(await screen.findByText("Đã lưu đầu sách Clean Architecture")).toBeInTheDocument();
  });

  it("loads shelves and creates a copy for the active title", async () => {
    const services=createTestServices();
    vi.mocked(services.listCatalogBranches.execute).mockResolvedValue([branch]);
    vi.mocked(services.listCatalogShelves.execute).mockResolvedValue([shelf]);
    vi.mocked(services.searchCatalog.execute).mockResolvedValue({items:[title],meta:{page:1,limit:20,total:1,totalPages:1}});
    vi.mocked(services.listCatalogCopies.execute).mockResolvedValue([]);
    vi.mocked(services.createCatalogCopy.execute).mockResolvedValue({id:"copy-1",bookTitleId:titleId,barcode:"COPY-001",rfid:null,branchId,shelfLocationId:shelfId,status:"AVAILABLE"});
    render(<ServicesProvider services={services}><CatalogPage /></ServicesProvider>);
    await userEvent.type(screen.getByLabelText("Từ khóa"),"clean");
    await userEvent.click(screen.getByRole("button",{name:"Tìm kiếm"}));
    await userEvent.click(await screen.findByRole("button",{name:"Chọn Clean Architecture"}));
    await userEvent.click(screen.getByRole("button",{name:"Bản sao"}));
    await userEvent.selectOptions(screen.getByLabelText("Chi nhánh bản sao"),branchId);
    await userEvent.selectOptions(await screen.findByLabelText("Kệ bản sao"),shelfId);
    await userEvent.type(screen.getByLabelText("Barcode"),"copy-001");
    await userEvent.click(screen.getByRole("button",{name:"Tạo bản sao"}));
    expect(services.createCatalogCopy.execute).toHaveBeenCalledWith(expect.objectContaining({bookTitleId:titleId,branchId,shelfLocationId:shelfId}));
    expect(await screen.findByText("COPY-001")).toBeInTheDocument();
  });
});
