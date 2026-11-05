using Microsoft.AspNetCore.Authorization;

namespace HongBeauty.Api.Authorization;

public sealed class RequirePermissionAttribute(string permission) : AuthorizeAttribute($"Permission:{permission}");
