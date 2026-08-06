CREATE POLICY "Usuário envia própria imagem de story"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Usuário apaga própria imagem de story"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Leitura autenticada de imagens de story"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'stories');