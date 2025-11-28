# ---------- Build stage ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy everything and publish (simple & reliable)
COPY . .
RUN dotnet publish -c Release -o /app/publish

# ---------- Runtime stage ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Copy published app
COPY --from=build /app/publish .

# Let ASP.NET listen on the port Render provides
ENV ASPNETCORE_URLS=http://0.0.0.0:$PORT

# Expose a port for clarity (Render maps $PORT at runtime)
EXPOSE 8080

# Run the app — automatically pick the first DLL in /app
# This is safer if the project DLL name differs from repository name.
CMD ["bash","-lc","dotnet /app/$(ls /app | grep '\\.dll$' | head -n1)"]
