import {
    ArrowDown,
    ArrowUp,
    Check,
    ChevronLeft,
    ChevronRight,
    Download,
    Eye,
    FileSpreadsheet,
    Pen,
    RotateCcw,
    Search,
    Trash,
    Maximize2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

// ============================================
// Hooks
// ============================================
function useDirection() {
    const getDir = () =>
        typeof document !== "undefined"
            ? document.documentElement.dir || "rtl"
            : "rtl";

    const [dir, setDir] = useState(getDir);

    useEffect(() => {
        const observer = new MutationObserver(() => setDir(getDir()));
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["dir"],
        });
        return () => observer.disconnect();
    }, []);

    return { dir, isRTL: dir === "rtl" };
}

// ============================================
// ثوابت
// ============================================
const DEFAULT_COL_WIDTH = 160;
const MIN_COL_WIDTH = 80;

const getRowId = (row) =>
    row?.id ?? row?._rowId ?? row?.row_id ?? row?.key;

// ============================================
// صف الجدول
// ============================================
const TableRow = ({ children, className = "" }) => (
    <tr
        className={`text-start border-b border-(--bg-border) transition-colors hover:bg-(--bg-hover) ${className}`}
    >
        {children}
    </tr>
);

// ============================================
// زر أيقونة صغير
// ============================================
const IconButton = ({
    onClick,
    title,
    children,
    variant = "default",
    disabled = false,
}) => {
    const variants = {
        default:
            "hover:bg-(--color-lavender) hover:text-(--bg-elevated) border-(--bg-border)",
        danger:
            "hover:bg-(--color-error) hover:text-(--bg-elevated) border-(--bg-border)",
        success:
            "hover:bg-(--color-mint) hover:text-(--bg-elevated) border-(--bg-border)",
    };
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            disabled={disabled}
            className={`w-8 h-8 rounded-md flex items-center justify-center cursor-pointer border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]}`}
        >
            {children}
        </button>
    );
};

// ============================================
// DataTable
// ============================================
export default function DataTable({
    data = [],
    columns = [],
    multiselect = false,
    selectAllPages = false,
    loading = false,
    error = null,
    onChange,
    onExport,
    exportFileName = "data",
    children,
}) {
    const { t } = useTranslation();
    const { isRTL } = useDirection();

    // State
    const [searchQuery, setSearchQuery] = useState("");
    const [listColumnsSort, setListColumnsSort] = useState({});
    const [selectedList, setSelectedList] = useState([]);
    const [PageSize, setPageSize] = useState(10);
    const [PageIndex, setPageIndex] = useState(0);
    const [colWidths, setColWidths] = useState({});
    const [resizing, setResizing] = useState(null);

    // Refs
    const tableRef = useRef(null);

    // ✅ إعادة تعيين الصفحة
    useEffect(() => {
        setPageIndex(0);
    }, [searchQuery, PageSize, data.length]);

    // ✅ إزالة العناصر المحددة اللي ما عادت موجودة
    useEffect(() => {
        if (data.length === 0) return;
        setSelectedList((prev) =>
            prev.filter((sel) =>
                data.some((row) => getRowId(row) === getRowId(sel))
            )
        );
    }, [data]);

    // ============================================
    // فلترة + ترتيب
    // ============================================
    const searchableColumns = useMemo(
        () => columns.filter((c) => c.name && c.name !== "events"),
        [columns]
    );

    const filteredData = useMemo(() => {
        let result = [...data];

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter((row) =>
                searchableColumns.some((col) => {
                    const val = row[col.name];
                    return (
                        val !== undefined &&
                        val !== null &&
                        String(val).toLowerCase().includes(q)
                    );
                })
            );
        }

        const sortCol = Object.keys(listColumnsSort)[0];
        if (sortCol) {
            const dir = listColumnsSort[sortCol];
            result.sort((a, b) => {
                const av = a[sortCol];
                const bv = b[sortCol];

                let cmp = 0;
                if (typeof av === "number" && typeof bv === "number") {
                    cmp = av - bv;
                } else {
                    cmp = String(av ?? "").localeCompare(
                        String(bv ?? ""),
                        "ar"
                    );
                }
                return dir === "asc" ? cmp : -cmp;
            });
        }

        return result;
    }, [data, searchQuery, listColumnsSort, searchableColumns]);

    // ============================================
    // Pagination
    // ============================================
    const PageCount = useMemo(() => {
        if (PageSize === -1) return 1;
        return Math.max(1, Math.ceil(filteredData.length / PageSize));
    }, [filteredData.length, PageSize]);

    const dataToView = useMemo(() => {
        if (PageSize === -1) return filteredData;
        const start = PageIndex * PageSize;
        return filteredData.slice(start, start + PageSize);
    }, [filteredData, PageIndex, PageSize]);

    // ============================================
    // Selection
    // ============================================
    const isRowSelected = useCallback(
        (row) =>
            selectedList.some((r) => getRowId(r) === getRowId(row)),
        [selectedList]
    );

    const toggleRow = (row) => {
        const exists = isRowSelected(row);
        const newItems = exists
            ? selectedList.filter((r) => getRowId(r) !== getRowId(row))
            : [...selectedList, row];

        setSelectedList(newItems);
        onChange?.(newItems);
    };

    const toggleCurrentPage = () => {
        const allSelected =
            dataToView.length > 0 &&
            dataToView.every((row) => isRowSelected(row));

        const newItems = allSelected
            ? selectedList.filter(
                  (r) =>
                      !dataToView.some(
                          (row) => getRowId(row) === getRowId(r)
                      )
              )
            : [
                  ...selectedList,
                  ...dataToView.filter((row) => !isRowSelected(row)),
              ];

        setSelectedList(newItems);
        onChange?.(newItems);
    };

    const toggleAllPages = () => {
        const allSelected =
            filteredData.length > 0 &&
            filteredData.every((row) => isRowSelected(row));

        const newItems = allSelected
            ? []
            : filteredData.filter((row) => !isRowSelected(row)).concat(
                  selectedList.filter((r) =>
                      filteredData.some(
                          (row) => getRowId(row) === getRowId(r)
                      )
                  )
              );

        const uniqueItems = Array.from(
            new Map(newItems.map((r) => [getRowId(r), r])).values()
        );

        setSelectedList(uniqueItems);
        onChange?.(uniqueItems);
    };

    // ============================================
    // Sorting
    // ============================================
    const reSortBy = (columnName) => {
        const current = listColumnsSort[columnName];
        const next =
            current === "asc"
                ? "desc"
                : current === "desc"
                ? null
                : "asc";

        if (next === null) {
            setListColumnsSort({});
        } else {
            setListColumnsSort({ [columnName]: next });
        }
    };

    // ============================================
    // Column Resizing
    // ============================================
    const startResize = (colName, e) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startWidth = colWidths[colName] || DEFAULT_COL_WIDTH;

        const onMouseMove = (moveEvent) => {
            const dx = moveEvent.clientX - startX;
            const newWidth = Math.max(MIN_COL_WIDTH, startWidth + dx);
            setColWidths((prev) => ({ ...prev, [colName]: newWidth }));
        };

        const onMouseUp = () => {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("mouseup", onMouseUp);
            setResizing(null);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        };

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);

        setResizing(colName);
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
    };

    const resetColWidths = () => {
        setColWidths({});
    };

    // ============================================
    // Export CSV
    // ============================================
    const exportCSV = (rows = filteredData) => {
        if (rows.length === 0) {
            if (typeof onExport === "function") {
                onExport(null, []);
            }
            return;
        }

        const exportCols = columns.filter((c) => c.name !== "events");

        const headers = exportCols.map((c) => c.headerText || c.name);

        const csvRows = rows.map((row) =>
            exportCols.map((col) => {
                const val = row[col.name];
                const str =
                    val === null || val === undefined ? "" : String(val);
                return `"${str.replace(/"/g, '""')}"`;
            })
        );

        const csv = [headers, ...csvRows]
            .map((r) => r.join(","))
            .join("\n");
        const blob = new Blob(["\uFEFF" + csv], {
            type: "text/csv;charset=utf-8;",
        });

        if (typeof onExport === "function") {
            onExport(blob, rows);
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${exportFileName}-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const exportSelected = () => {
        if (selectedList.length === 0) return;
        exportCSV(selectedList);
    };

    // ============================================
    // Rendering Cell Content
    // ============================================
    const renderCellContent = (row, col) => {
        if (col.name === "events") {
            if (!Array.isArray(col.events) || col.events.length === 0) {
                return (
                    <span className="text-xs text-(--text-muted)">—</span>
                );
            }

            return (
                <div className="flex gap-1">
                    {col.events.map((ev, i) => (
                        <IconButton
                            key={i}
                            title={ev.name}
                            onClick={() => ev.event(row)}
                            variant={
                                ev.name === "on_delete"
                                    ? "danger"
                                    : "default"
                            }
                        >
                            {ev.name === "on_delete" && <Trash size={12} />}
                            {ev.name === "on_edit" && <Pen size={12} />}
                            {ev.name === "on_preview" && <Eye size={12} />}
                            {ev.name === "on_restore" && (
                                <RotateCcw size={12} />
                            )}
                        </IconButton>
                    ))}
                </div>
            );
        }

        if (typeof col.render === "function") {
            return col.render(row);
        }

        const val = row[col.name];
        return val === null || val === undefined ? "—" : val;
    };

    // ============================================
    // Rows
    // ============================================
    const rows = useMemo(() => {
        if (loading) {
            return (
                <TableRow>
                    <td
                        colSpan={columns.length + (multiselect ? 1 : 0)}
                        className="p-6 text-center"
                    >
                        <div className="flex items-center justify-center gap-2 text-(--text-muted)">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-(--bg-border) border-t-(--color-lavender)" />
                            {t("dataTable.loading")}
                        </div>
                    </td>
                </TableRow>
            );
        }

        if (error) {
            return (
                <TableRow>
                    <td
                        colSpan={columns.length + (multiselect ? 1 : 0)}
                        className="p-6 text-center text-(--color-error)"
                    >
                        {error}
                    </td>
                </TableRow>
            );
        }

        if (dataToView.length === 0) {
            return (
                <TableRow>
                    <td
                        colSpan={columns.length + (multiselect ? 1 : 0)}
                        className="p-6 text-center text-(--text-muted)"
                    >
                        {searchQuery
                            ? t("dataTable.noResults")
                            : t("dataTable.noData")}
                    </td>
                </TableRow>
            );
        }

        try {
            return dataToView.map((row, index) => {
                const isSelected = isRowSelected(row);
                const rowId = getRowId(row) ?? index;

                return (
                    <TableRow
                        key={rowId}
                        className={isSelected ? "bg-(--bg-hover)" : ""}
                    >
                        {multiselect && (
                            <td
                                className="p-3 px-5 text-start"
                                style={{ width: 48, minWidth: 48 }}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleRow(row)}
                                    className={`w-5 h-5 rounded-md flex items-center justify-center cursor-pointer border transition-colors ${
                                        isSelected
                                            ? "bg-(--color-lavender) text-(--bg-elevated) border-(--color-lavender)"
                                            : "border-(--bg-border) hover:bg-(--color-lavender)/20"
                                    }`}
                                >
                                    {isSelected && <Check size={12} />}
                                </button>
                            </td>
                        )}

                        {columns.map((col) => {
                            const width = colWidths[col.name];
                            return (
                                <td
                                    key={col.name}
                                    className="p-3 px-5 text-start text-[10pt]"
                                    style={{
                                        width: width ?? col.width ?? "auto",
                                        minWidth:
                                            col.minWidth ?? MIN_COL_WIDTH,
                                    }}
                                >
                                    {renderCellContent(row, col)}
                                </td>
                            );
                        })}
                    </TableRow>
                );
            });
        } catch (err) {
            return (
                <TableRow>
                    <td
                        colSpan={columns.length + (multiselect ? 1 : 0)}
                        className="p-3 px-5 text-(--color-error)"
                    >
                        {err.message}
                    </td>
                </TableRow>
            );
        }
    }, [
        dataToView,
        multiselect,
        selectedList,
        columns,
        colWidths,
        isRowSelected,
        loading,
        error,
        searchQuery,
        t,
    ]);

    // ============================================
    // Columns Header
    // ============================================
    const columnsHeader = (
        <tr className="select-none">
            {multiselect && (
                <th
                    className="p-2 px-5 text-start font-bold text-[9pt]"
                    style={{ width: 48, minWidth: 48 }}
                >
                    <button
                        type="button"
                        onClick={toggleCurrentPage}
                        title={t("dataTable.selectCurrentPage")}
                        className="w-5 h-5 rounded-md flex items-center justify-center cursor-pointer border border-(--bg-border) hover:bg-(--color-lavender)/20"
                    >
                        {dataToView.length > 0 &&
                            dataToView.every((row) =>
                                isRowSelected(row)
                            ) && <Check size={12} />}
                    </button>
                </th>
            )}

            {columns.map((col) => {
                const sortDir = listColumnsSort[col.name];
                const width = colWidths[col.name];

                return (
                    <th
                        key={col.name}
                        className="relative p-2 px-5 text-start font-bold text-[9pt]"
                        style={{
                            width: width ?? col.width ?? "auto",
                            minWidth: col.minWidth ?? MIN_COL_WIDTH,
                        }}
                    >
                        <div className="flex items-center justify-between gap-2">
                            <b className="truncate">
                                {col?.headerText || "..."}
                            </b>
                            {col.sortable && (
                                <button
                                    type="button"
                                    className="rounded-full hover:bg-(--bg-hover) p-1 cursor-pointer transition-colors"
                                    onClick={() => reSortBy(col.name)}
                                    title={
                                        sortDir === "asc"
                                            ? t("dataTable.sortAsc")
                                            : sortDir === "desc"
                                            ? t("dataTable.sortDesc")
                                            : t("dataTable.sort")
                                    }
                                >
                                    {sortDir === "asc" ? (
                                        <ArrowUp
                                            size={14}
                                            className="text-(--color-lavender)"
                                        />
                                    ) : sortDir === "desc" ? (
                                        <ArrowDown
                                            size={14}
                                            className="text-(--color-lavender)"
                                        />
                                    ) : (
                                        <ArrowDown
                                            size={14}
                                            className="opacity-40"
                                        />
                                    )}
                                </button>
                            )}
                        </div>

                        <div
                            onMouseDown={(e) => startResize(col.name, e)}
                            className={`absolute inset-y-0 ${
                                isRTL ? "left-0" : "right-0"
                            } w-1 cursor-col-resize transition-colors ${
                                resizing === col.name
                                    ? "bg-(--color-lavender)"
                                    : "hover:bg-(--color-lavender)/50"
                            }`}
                            style={{ userSelect: "none" }}
                        />
                    </th>
                );
            })}
        </tr>
    );

    // ============================================
    // Header (Toolbar)
    // ============================================
    const header = (
        <div className="flex flex-col-reverse md:flex-row gap-3 p-3 border-b border-(--bg-border) bg-(--bg-card) justify-between items-end md:items-center w-full">
            <div className="relative flex items-center w-full md:w-auto">
                <Search
                    size={17}
                    className="absolute inset-s-3 text-(--text-muted) pointer-events-none"
                />
                <input
                    type="search"
                    placeholder={t("dataTable.search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="p-2 ps-10 rounded-xl outline-0 border border-(--bg-border) text-sm bg-(--bg-main) text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--color-lavender) transition-colors w-full"
                />
            </div>

            <div className="flex items-center justify-between gap-2">
                <IconButton
                    title={t("dataTable.deleteSelected")}
                    variant="danger"
                    disabled={selectedList.length === 0}
                    onClick={() =>
                        selectedList.length > 0 &&
                        console.log("delete", selectedList)
                    }
                >
                    <Trash size={15} />
                </IconButton>

                {selectedList.length > 0 && (
                    <IconButton
                        title={t("dataTable.exportSelected", {
                            count: selectedList.length,
                        })}
                        variant="success"
                        onClick={exportSelected}
                    >
                        <FileSpreadsheet size={15} />
                    </IconButton>
                )}

                <IconButton
                    title={t("dataTable.exportCsv")}
                    onClick={() => exportCSV(filteredData)}
                >
                    <Download size={15} />
                </IconButton>

                {Object.keys(colWidths).length > 0 && (
                    <IconButton
                        title={t("dataTable.resetWidths")}
                        onClick={resetColWidths}
                    >
                        <RotateCcw size={15} />
                    </IconButton>
                )}

                {multiselect &&
                    selectAllPages &&
                    filteredData.length > 0 && (
                        <button
                            type="button"
                            onClick={toggleAllPages}
                            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                                filteredData.every((row) =>
                                    isRowSelected(row)
                                )
                                    ? "border-(--color-lavender) bg-(--color-lavender)/10 text-(--color-lavender)"
                                    : "border-(--bg-border) text-(--text-secondary) hover:bg-(--bg-hover)"
                            }`}
                        >
                            <Maximize2 size={13} />
                            <span>
                                {filteredData.every((row) =>
                                    isRowSelected(row)
                                )
                                    ? t("dataTable.unselectAll")
                                    : t("dataTable.selectAll")}
                            </span>
                        </button>
                    )}

                {children}
            </div>
        </div>
    );

    // ============================================
    // Footer
    // ============================================
    const footer = (
        <div className="flex flex-col-reverse md:flex-row gap-3 p-3 border-t border-(--bg-border) bg-(--bg-card) justify-between items-end md:items-center w-full">
            <div className="flex flex-wrap gap-2 items-center text-(--text-muted)">
                <div className="flex gap-1 items-center">
                    <small>{t("dataTable.selectedLabel")}</small>
                    <small className="font-bold text-(--text-primary)">
                        {selectedList.length}
                    </small>
                    <small>{t("dataTable.ofLabel")}</small>
                    <small className="font-bold text-(--text-primary)">
                        {filteredData.length}
                    </small>
                </div>

                {searchQuery && (
                    <div className="flex gap-1 items-center">
                        <small>{t("dataTable.searchResults")}</small>
                        <small className="font-bold text-(--color-lavender)">
                            {filteredData.length}
                        </small>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                <select
                    value={PageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="border border-(--bg-border) rounded-md px-2 py-1 outline-0 cursor-pointer text-sm bg-(--bg-main) text-(--text-primary)"
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={-1}>
                        {t("dataTable.pageSizeAll")}
                    </option>
                </select>

                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() =>
                            PageIndex > 0 && setPageIndex(PageIndex - 1)
                        }
                        disabled={PageIndex === 0}
                        className="p-1 rounded-md hover:bg-(--bg-hover) disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title={t("dataTable.previous")}
                    >
                        {isRTL ? (
                            <ChevronRight size={18} />
                        ) : (
                            <ChevronLeft size={18} />
                        )}
                    </button>

                    <span className="text-sm font-medium text-(--text-primary)">
                        {PageIndex + 1} / {PageCount}
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            PageIndex < PageCount - 1 &&
                            setPageIndex(PageIndex + 1)
                        }
                        disabled={PageIndex >= PageCount - 1}
                        className="p-1 rounded-md hover:bg-(--bg-hover) disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title={t("dataTable.next")}
                    >
                        {isRTL ? (
                            <ChevronLeft size={18} />
                        ) : (
                            <ChevronRight size={18} />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    // ============================================
    // Render
    // ============================================
    return (
        <>
            {header}
            <div
                ref={tableRef}
                className="overflow-x-auto"
                style={{ cursor: resizing ? "col-resize" : "auto" }}
            >
                <table className="w-full">
                    <thead className="bg-(--bg-main) dark:bg-(--bg-card)">
                        {columnsHeader}
                    </thead>
                    <tbody>{rows}</tbody>
                </table>
            </div>
            {footer}
        </>
    );
}