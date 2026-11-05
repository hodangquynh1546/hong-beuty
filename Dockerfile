FROM node:22-bookworm AS ui
WORKDIR /src/HongBeautyUI
COPY HongBeautyUI/package*.json ./
RUN npm ci
COPY HongBeautyUI/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY HongBeautyAPI/ ./HongBeautyAPI/
RUN dotnet restore HongBeautyAPI/HongBeauty.slnx
RUN dotnet publish HongBeautyAPI/src/HongBeauty.Api/HongBeauty.Api.csproj -c Release -o /out --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /out ./
COPY --from=ui /src/HongBeautyUI/dist/HongBeautyUI/browser ./wwwroot/
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "HongBeauty.Api.dll"]
