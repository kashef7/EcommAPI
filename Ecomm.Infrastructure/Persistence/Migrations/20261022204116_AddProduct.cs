using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Ecomm.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Products",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    StockQuantity = table.Column<int>(type: "integer", nullable: false),
                    Tag = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ImageUrl = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Products", x => x.Id);
                    table.CheckConstraint("CK_Products_Price_Positive", "\"Price\" > 0");
                    table.CheckConstraint("CK_Products_Stock_NonNegative", "\"StockQuantity\" >= 0");
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_RefreshTokenHash",
                table: "Users",
                column: "RefreshTokenHash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_Name",
                table: "Products",
                column: "Name");

            migrationBuilder.CreateIndex(
                name: "IX_Products_Tag",
                table: "Products",
                column: "Tag");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Users_RefreshTokenHash",
                table: "Users");
        }
    }
}
