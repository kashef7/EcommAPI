using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecomm.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddOptionValueSortOrderAndCartItemUnitPriceAtAdd : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Add SortOrder to ProductOptionValues
            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "ProductOptionValues",
                type: "integer",
                nullable: true);

            // Backfill SortOrder by current Id order within each option
            migrationBuilder.Sql(@"
UPDATE ""ProductOptionValues"" pov
SET ""SortOrder"" = sub.rn
FROM (
    SELECT ""Id"", (ROW_NUMBER() OVER (PARTITION BY ""OptionId"" ORDER BY ""Id"") - 1)::integer AS rn
    FROM ""ProductOptionValues""
) sub
WHERE pov.""Id"" = sub.""Id"";

UPDATE ""ProductOptionValues"" SET ""SortOrder"" = 0 WHERE ""SortOrder"" IS NULL;
ALTER TABLE ""ProductOptionValues"" ALTER COLUMN ""SortOrder"" SET NOT NULL;
");

            migrationBuilder.AlterColumn<int>(
                name: "SortOrder",
                table: "ProductOptionValues",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            // 2. Add UnitPriceAtAdd to CartItems
            migrationBuilder.AddColumn<decimal>(
                name: "UnitPriceAtAdd",
                table: "CartItems",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            // Backfill UnitPriceAtAdd from each item's variant's current price
            migrationBuilder.Sql(@"
UPDATE ""CartItems"" ci
SET ""UnitPriceAtAdd"" = pv.""Price""
FROM ""ProductVariants"" pv
WHERE ci.""VariantId"" = pv.""Id"";

UPDATE ""CartItems"" SET ""UnitPriceAtAdd"" = 0 WHERE ""UnitPriceAtAdd"" IS NULL;
ALTER TABLE ""CartItems"" ALTER COLUMN ""UnitPriceAtAdd"" SET NOT NULL;
");

            migrationBuilder.AlterColumn<decimal>(
                name: "UnitPriceAtAdd",
                table: "CartItems",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)",
                oldPrecision: 18,
                oldScale: 2,
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "ProductOptionValues");

            migrationBuilder.DropColumn(
                name: "UnitPriceAtAdd",
                table: "CartItems");
        }
    }
}
