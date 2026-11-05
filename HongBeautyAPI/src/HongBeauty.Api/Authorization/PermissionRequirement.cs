using System.Security.Claims;
using HongBeauty.Application.Features.Auth;
using Microsoft.AspNetCore.Authorization;

namespace HongBeauty.Api.Authorization;

public sealed record PermissionRequirement(string Permission) : IAuthorizationRequirement;

public sealed class PermissionHandler(IUserAccountStore users) : AuthorizationHandler<PermissionRequirement>
{
    protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, PermissionRequirement requirement)
    {
        var rawId = context.User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(rawId, out var id)) return;
        var permissions = await users.GetPermissionsAsync(id, CancellationToken.None);
        if (permissions.Contains(requirement.Permission, StringComparer.Ordinal)) context.Succeed(requirement);
    }
}
