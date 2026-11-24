using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecomm.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProductVariantsAndCart : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Drop old foreign key from CartItems to Products
            migrationBuilder.DropForeignKey(
                name: "FK_CartItems_Products_ProductId",
                table: "CartItems");

            // 2. Create ProductOptions table
            migrationBuilder.CreateTable(
                name: "ProductOptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductOptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductOptions_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // 3. Create ProductVariants table
            migrationBuilder.CreateTable(
                name: "ProductVariants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ProductId = table.Column<Guid>(type: "uuid", nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    StockQuantity = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductVariants", x => x.Id);
                    table.CheckConstraint("CK_ProductVariants_Price_Positive", "\"Price\" > 0");
                    table.CheckConstraint("CK_ProductVariants_Stock_NonNegative", "\"StockQuantity\" >= 0");
                    table.ForeignKey(
                        name: "FK_ProductVariants_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            // 4. Create ProductOptionValues table
            migrationBuilder.CreateTable(
                name: "ProductOptionValues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OptionId = table.Column<Guid>(type: "uuid", nullable: false),
                    Value = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductOptionValues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductOptionValues_ProductOptions_OptionId",
                        column: x => x.OptionId,
                        principalTable: "ProductOptions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // 5. Create VariantOptionValues table
            migrationBuilder.CreateTable(
                name: "VariantOptionValues",
                columns: table => new
                {
                    VariantId = table.Column<Guid>(type: "uuid", nullable: false),
                    OptionValueId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VariantOptionValues", x => new { x.VariantId, x.OptionValueId });
                    table.ForeignKey(
                        name: "FK_VariantOptionValues_ProductOptionValues_OptionValueId",
                        column: x => x.OptionValueId,
                        principalTable: "ProductOptionValues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VariantOptionValues_ProductVariants_VariantId",
                        column: x => x.VariantId,
                        principalTable: "ProductVariants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // 6. Create indexes for new tables
            migrationBuilder.CreateIndex(
                name: "IX_ProductOptions_ProductId_Name",
                table: "ProductOptions",
                columns: new[] { "ProductId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductOptionValues_OptionId_Value",
                table: "ProductOptionValues",
                columns: new[] { "OptionId", "Value" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductVariants_ProductId",
                table: "ProductVariants",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_VariantOptionValues_OptionValueId",
                table: "VariantOptionValues",
                column: "OptionValueId");

            // 7. Backfill: create one default variant per existing product, copying its Price, StockQuantity and DeletedAt
            migrationBuilder.Sql(@"
INSERT INTO ""ProductVariants"" (""Id"", ""ProductId"", ""Price"", ""StockQuantity"", ""CreatedAt"", ""UpdatedAt"", ""DeletedAt"")
SELECT gen_random_uuid(), p.""Id"", p.""Price"", p.""StockQuantity"", p.""CreatedAt"", p.""UpdatedAt"", p.""DeletedAt""
FROM ""Products"" p
WHERE NOT EXISTS (SELECT 1 FROM ""ProductVariants"" pv WHERE pv.""ProductId"" = p.""Id"");
");

            // 8. Convert CartItems: add VariantId, backfill from product's default variant, switch PK and FK
            migrationBuilder.AddColumn<Guid>(
                name: "VariantId",
                table: "CartItems",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql(@"
UPDATE ""CartItems"" ci
SET ""VariantId"" = (
    SELECT pv.""Id""
    FROM ""ProductVariants"" pv
    WHERE pv.""ProductId"" = ci.""ProductId""
    LIMIT 1
);
DELETE FROM ""CartItems"" WHERE ""VariantId"" IS NULL;
");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CartItems",
                table: "CartItems");

            migrationBuilder.DropIndex(
                name: "IX_CartItems_ProductId",
                table: "CartItems");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "CartItems");

            migrationBuilder.AlterColumn<Guid>(
                name: "VariantId",
                table: "CartItems",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_CartItems",
                table: "CartItems",
                columns: new[] { "CartId", "VariantId" });

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_VariantId",
                table: "CartItems",
                column: "VariantId");

            migrationBuilder.AddForeignKey(
                name: "FK_CartItems_ProductVariants_VariantId",
                table: "CartItems",
                column: "VariantId",
                principalTable: "ProductVariants",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // 9. Move check constraints from Products to ProductVariants and drop old columns
            migrationBuilder.DropCheckConstraint(
                name: "CK_Products_Price_Positive",
                table: "Products");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Products_Stock_NonNegative",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Price",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "StockQuantity",
                table: "Products");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Restore Price and StockQuantity on Products
            migrationBuilder.AddColumn<decimal>(
                name: "Price",
                table: "Products",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 1m);

            migrationBuilder.AddColumn<int>(
                name: "StockQuantity",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql(@"
UPDATE ""Products"" p
SET ""Price"" = COALESCE((SELECT pv.""Price"" FROM ""ProductVariants"" pv WHERE pv.""ProductId"" = p.""Id"" LIMIT 1), 1),
    ""StockQuantity"" = COALESCE((SELECT pv.""StockQuantity"" FROM ""ProductVariants"" pv WHERE pv.""ProductId"" = p.""Id"" LIMIT 1), 0);
");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Products_Price_Positive",
                table: "Products",
                sql: "\"Price\" > 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Products_Stock_NonNegative",
                table: "Products",
                sql: "\"StockQuantity\" >= 0");

            // Revert CartItems from VariantId to ProductId
            migrationBuilder.DropForeignKey(
                name: "FK_CartItems_ProductVariants_VariantId",
                table: "CartItems");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CartItems",
                table: "CartItems");

            migrationBuilder.DropIndex(
                name: "IX_CartItems_VariantId",
                table: "CartItems");

            migrationBuilder.AddColumn<Guid>(
                name: "ProductId",
                table: "CartItems",
                type: "uuid",
                nullable: true);

            migrationBuilder.Sql(@"
UPDATE ""CartItems"" ci
SET ""ProductId"" = (
    SELECT pv.""ProductId""
    FROM ""ProductVariants"" pv
    WHERE pv.""Id"" = ci.""VariantId""
    LIMIT 1
);
DELETE FROM ""CartItems"" WHERE ""ProductId"" IS NULL;
");

            migrationBuilder.DropColumn(
                name: "VariantId",
                table: "CartItems");

            migrationBuilder.AlterColumn<Guid>(
                name: "ProductId",
                table: "CartItems",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "PK_CartItems",
                table: "CartItems",
                columns: new[] { "CartId", "ProductId" });

            migrationBuilder.CreateIndex(
                name: "IX_CartItems_ProductId",
                table: "CartItems",
                column: "ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_CartItems_Products_ProductId",
                table: "CartItems",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // Drop variant and option tables
            migrationBuilder.DropTable(
                name: "VariantOptionValues");

            migrationBuilder.DropTable(
                name: "ProductOptionValues");

            migrationBuilder.DropTable(
                name: "ProductVariants");

            migrationBuilder.DropTable(
                name: "ProductOptions");
        }
    }
}
