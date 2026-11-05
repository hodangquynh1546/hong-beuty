using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace HongBeauty.Api.Authorization;

public sealed class PermissionPolicyProvider(IOptions<AuthorizationOptions> options) : DefaultAuthorizationPolicyProvider(options)
{
    public override Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        const string prefix = "Permission:";
        if (!policyName.StartsWith(prefix, StringComparison.Ordinal)) return base.GetPolicyAsync(policyName);
        var permission = policyName[prefix.Length..];
        if (string.IsNullOrWhiteSpace(permission)) return Task.FromResult<AuthorizationPolicy?>(null);
        return Task.FromResult<AuthorizationPolicy?>(new AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .AddRequirements(new PermissionRequirement(permission))
            .Build());
    }
}
