using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HongBeauty.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RolePermissionGrants : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Permissions",
                table: "users");

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "users",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Customer");

            migrationBuilder.CreateTable(
                name: "bootstrap_markers",
                columns: table => new
                {
                    Key = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bootstrap_markers", x => x.Key);
                });

            migrationBuilder.CreateTable(
                name: "role_permission_grants",
                columns: table => new
                {
                    Role = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Permission = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_permission_grants", x => new { x.Role, x.Permission });
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_users_Role",
                table: "users",
                sql: "\"Role\" IN ('Admin', 'Staff', 'Customer')");

            migrationBuilder.InsertData(
                table: "role_permission_grants",
                columns: new[] { "Role", "Permission" },
                values: new object[,]
                {
                    { "Admin", "catalog.write" },
                    { "Admin", "orders.manage" },
                    { "Admin", "appointments.manage" },
                    { "Admin", "users.manage" },
                    { "Staff", "catalog.write" },
                    { "Staff", "orders.manage" },
                    { "Staff", "appointments.manage" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "bootstrap_markers");

            migrationBuilder.DropTable(
                name: "role_permission_grants");

            migrationBuilder.DropCheckConstraint(
                name: "CK_users_Role",
                table: "users");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "users");

            migrationBuilder.AddColumn<string[]>(
                name: "Permissions",
                table: "users",
                type: "text[]",
                nullable: false,
                defaultValue: new string[0]);
        }
    }
}
