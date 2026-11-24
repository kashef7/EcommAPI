using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecomm.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoriesTagsImages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Create Categories table
            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categories", x => x.Id);
                });

            // 2. Create Tags table
            migrationBuilder.CreateTable(
                name: "Tags",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tags", x => x.Id);
                });

            // 3. Create ProductImages table
            migrationBuilder.CreateTable(
                name: "ProductImages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductImages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductImages_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // 4. Create ProductTags table
            migrationBuilder.CreateTable(
                name: "ProductTags",
                columns: table => new
                {
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    TagId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductTags", x => new { x.ProductId, x.TagId });
                    table.ForeignKey(
                        name: "FK_ProductTags_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProductTags_Tags_TagId",
                        column: x => x.TagId,
                        principalTable: "Tags",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // 5. Add CategoryId column as nullable initially for backfill
            migrationBuilder.AddColumn<Guid>(
                name: "CategoryId",
                table: "Products",
                type: "uuid",
                nullable: true);

            // 6. Backfill existing data
            migrationBuilder.Sql(@"
DO $$
DECLARE
    uncat_id uuid := '018f0000-0000-7000-8000-000000000001'::uuid;
BEGIN
    -- 6a. Create one 'Uncategorized' category if not exists
    IF NOT EXISTS (SELECT 1 FROM ""Categories"" WHERE ""Name"" = 'Uncategorized') THEN
        INSERT INTO ""Categories"" (""Id"", ""Name"", ""CreatedAt"", ""UpdatedAt"")
        VALUES (uncat_id, 'Uncategorized', NOW() AT TIME ZONE 'UTC', NOW() AT TIME ZONE 'UTC');
    ELSE
        SELECT ""Id"" INTO uncat_id FROM ""Categories"" WHERE ""Name"" = 'Uncategorized' LIMIT 1;
    END IF;

    -- 6b. Assign every existing product to 'Uncategorized'
    UPDATE ""Products"" SET ""CategoryId"" = uncat_id WHERE ""CategoryId"" IS NULL;

    -- 6c. Turn each existing non-empty Product.Tag string into a Tag row plus a ProductTags link
    INSERT INTO ""Tags"" (""Id"", ""Name"", ""CreatedAt"")
    SELECT gen_random_uuid(), lower(trim(""Tag"")), NOW() AT TIME ZONE 'UTC'
    FROM (SELECT DISTINCT lower(trim(""Tag"")) AS ""Tag"" FROM ""Products"" WHERE ""Tag"" IS NOT NULL AND trim(""Tag"") <> '') sub
    WHERE NOT EXISTS (SELECT 1 FROM ""Tags"" WHERE ""Tags"".""Name"" = sub.""Tag"");

    INSERT INTO ""ProductTags"" (""ProductId"", ""TagId"", ""CreatedAt"")
    SELECT p.""Id"", t.""Id"", NOW() AT TIME ZONE 'UTC'
    FROM ""Products"" p
    JOIN ""Tags"" t ON lower(trim(p.""Tag"")) = t.""Name""
    WHERE p.""Tag"" IS NOT NULL AND trim(p.""Tag"") <> ''
    ON CONFLICT DO NOTHING;

    -- 6d. Turn each existing non-empty Product.ImageUrl into a ProductImages row (SortOrder 0)
    INSERT INTO ""ProductImages"" (""Id"", ""ProductId"", ""Url"", ""SortOrder"", ""CreatedAt"")
    SELECT gen_random_uuid(), p.""Id"", trim(p.""ImageUrl""), 0, NOW() AT TIME ZONE 'UTC'
    FROM ""Products"" p
    WHERE p.""ImageUrl"" IS NOT NULL AND trim(p.""ImageUrl"") <> ''
    ON CONFLICT DO NOTHING;
END $$;
");

            // 7. Make CategoryId required
            migrationBuilder.AlterColumn<Guid>(
                name: "CategoryId",
                table: "Products",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            // 8. Add foreign key from Products to Categories
            migrationBuilder.AddForeignKey(
                name: "FK_Products_Categories_CategoryId",
                table: "Products",
                column: "CategoryId",
                principalTable: "Categories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // 9. Drop old indexes and columns
            migrationBuilder.DropIndex(
                name: "IX_Products_Tag",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Tag",
                table: "Products");

            // 10. Create indexes
            migrationBuilder.CreateIndex(
                name: "IX_Products_CategoryId",
                table: "Products",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_Categories_Name",
                table: "Categories",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductImages_ProductId_SortOrder",
                table: "ProductImages",
                columns: new[] { "ProductId", "SortOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_ProductTags_TagId",
                table: "ProductTags",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_Tags_Name",
                table: "Tags",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Restore Tag and ImageUrl columns
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Products",
                type: "character varying(2048)",
                maxLength: 2048,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tag",
                table: "Products",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.Sql(@"
UPDATE ""Products"" p
SET ""Tag"" = COALESCE((
    SELECT t.""Name""
    FROM ""ProductTags"" pt
    JOIN ""Tags"" t ON pt.""TagId"" = t.""Id""
    WHERE pt.""ProductId"" = p.""Id""
    LIMIT 1
), 'general'),
""ImageUrl"" = (
    SELECT pi.""Url""
    FROM ""ProductImages"" pi
    WHERE pi.""ProductId"" = p.""Id""
    ORDER BY pi.""SortOrder"" ASC
    LIMIT 1
);
");

            migrationBuilder.AlterColumn<string>(
                name: "Tag",
                table: "Products",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_Tag",
                table: "Products",
                column: "Tag");

            migrationBuilder.DropForeignKey(
                name: "FK_Products_Categories_CategoryId",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Products_CategoryId",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "CategoryId",
                table: "Products");

            migrationBuilder.DropTable(
                name: "ProductTags");

            migrationBuilder.DropTable(
                name: "ProductImages");

            migrationBuilder.DropTable(
                name: "Tags");

            migrationBuilder.DropTable(
                name: "Categories");
        }
    }
}
