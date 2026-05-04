# 1. Imagen base oficial de Python
FROM python:3.12-slim

# 2. Directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiar solo el archivo de requerimientos para aprovechar la caché
COPY requirements.txt .

# 4. Instalar dependencias
RUN pip install --no-cache-dir -r requirements.txt

# 5. Copiar el resto del código del proyecto
COPY . .

# 6. Comando para iniciar FastAPI
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "1104"]