namespace HongBeauty.Domain.Users;

public sealed class RolePermissionGrant
{
    public string Role { get; private set; } = string.Empty;
    public string Permission { get; private set; } = string.Empty;

    private RolePermissionGrant() { }

    public RolePermissionGrant(string role, string permission)
    {
        Role = role;
        Permission = permission;
    }
}
