CREATE OR REPLACE VIEW "leonidas_disponibilidad_muscular" AS
  SELECT
    lps.usuario_id,
    lps.dia_semana,
    lps.tipo,
    lps.grupos_planeados,
    CASE
      WHEN MAX(ls.timestamp) > NOW() - INTERVAL '48 hours' THEN false
      ELSE true
    END AS disponible
  FROM leonidas_plan_semanal lps
  LEFT JOIN leonidas_sesiones ls
    ON ls.usuario_id = lps.usuario_id
    AND ls.grupos_trabajados && lps.grupos_planeados
  WHERE lps.activo = true
  GROUP BY lps.usuario_id, lps.dia_semana, lps.tipo, lps.grupos_planeados;
