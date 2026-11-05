using FluentValidation;
using HongBeauty.Application.Features.Products;

namespace HongBeauty.Api.Features.Products;

public sealed class CategoryInputValidator : AbstractValidator<CategoryInput>
{
    public CategoryInputValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(180);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(200).Matches("^[a-z0-9]+(?:-[a-z0-9]+)*$");
        RuleFor(x => x.Description).NotNull().MaximumLength(2000);
    }
}

public sealed class ProductInputValidator : AbstractValidator<ProductInput>
{
    public ProductInputValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(180);
        RuleFor(x => x.Slug).NotEmpty().MaximumLength(200).Matches("^[a-z0-9]+(?:-[a-z0-9]+)*$");
        RuleFor(x => x.Description).NotNull().MaximumLength(5000);
        RuleFor(x => x.Price).GreaterThanOrEqualTo(0).LessThanOrEqualTo(9999999999999999m);
        RuleFor(x => x.SalePrice).GreaterThanOrEqualTo(0).LessThanOrEqualTo(x => x.Price).When(x => x.SalePrice.HasValue);
        RuleFor(x => x.Stock).GreaterThanOrEqualTo(0);
        RuleFor(x => x.ImageUrl).MaximumLength(2048).Must(x => x is null ||
            (x.StartsWith("/api/v1/product-images/", StringComparison.Ordinal) ||
             (Uri.TryCreate(x, UriKind.Absolute, out var uri) && uri.Scheme == Uri.UriSchemeHttps)))
            .WithMessage("Image URL must use HTTPS or a stored product image.");
    }
}
