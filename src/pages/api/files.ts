import { supabase } from "@/utils/supabaseClient";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === "POST") {
      const { name, path, size, type, preview_url, tags } = req.body;

      if (!name || !path) {
        return res.status(400).json({ error: "Name and path are required." });
      }

      const { data: fileData, error: fileError } = await supabase
        .from("files")
        .insert([{ name, path, size, type, preview_url }])
        .select();

      if (fileError) {
        console.error("File Insert Error:", fileError);
        throw fileError;
      }

      const fileId = fileData[0].id;

      if (tags && Array.isArray(tags)) {
        for (const tagName of tags) {
          let { data: tagData, error: tagError } = await supabase
            .from("tags")
            .select("*")
            .eq("name", tagName)
            .single();

          if (!tagData && !tagError) {
            const { data: newTag, error: newTagError } = await supabase
              .from("tags")
              .insert([{ name: tagName }])
              .select()
              .single();

            if (newTagError) {
              console.error("Tag Insert Error:", newTagError);
              throw newTagError;
            }

            tagData = newTag;
          } else if (tagError) {
            console.error("Tag Fetch Error:", tagError);
            throw tagError;
          }

          const { error: fileTagError } = await supabase
            .from("file_tags")
            .insert([{ file_id: fileId, tag_id: tagData.id }]);

          if (fileTagError) {
            console.error("File-Tag Insert Error:", fileTagError);
            throw fileTagError;
          }
        }
      }

      return res
        .status(200)
        .json({ message: "File added successfully", file: fileData[0] });
    } else {
      res.setHeader("Allow", ["POST"]);
      return res
        .status(405)
        .json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ error: "An unexpected error occurred." });
  }
}
