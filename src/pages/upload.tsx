import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";
import STLPreview from "@/components/STLPreview";

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      const { data, error } = await supabase.from("tags").select("name");
      if (error) {
        console.error("Error fetching tags:", error);
      } else {
        setAvailableTags(data.map((tag) => tag.name));
      }
    };

    fetchTags();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile) {
      const extension = selectedFile.name.split(".").pop()?.toUpperCase();
      if (["STL", "OBJ", "PNG", "JPG"].includes(extension || "")) {
        setType(extension!);
      } else {
        alert(
          "Unsupported file type. Please select a valid STL, OBJ, PNG, or JPG file."
        );
        setFile(null);
        setType("");
      }
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file || !type || tags.length === 0) {
      alert("Please complete all fields.");
      return;
    }

    setUploading(true);

    try {
      const fileInfo = {
        name: file.name,
        path: `/uploads/${file.name}`,
        size: file.size,
        type,
      };

      const { data: fileData, error: fileError } = await supabase
        .from("files")
        .insert([fileInfo])
        .select();

      if (fileError) {
        console.error("Error inserting file into database:", fileError);
        alert("Failed to save file details.");
        return;
      }

      const fileId = fileData[0].id;

      for (const tag of tags) {
        const { data: tagData, error: tagError } = await supabase
          .from("tags")
          .select("id")
          .eq("name", tag)
          .single();

        if (tagError || !tagData) {
          console.error(`Error finding tag "${tag}" in database:`, tagError);
          continue;
        }

        const tagId = tagData.id;

        const { error: fileTagError } = await supabase
          .from("file_tags")
          .insert([{ file_id: fileId, tag_id: tagId }]);

        if (fileTagError) {
          console.error("Error associating file with tag:", fileTagError);
        }
      }

      alert("File metadata saved successfully!");
      setFile(null);
      setType("");
      setTags([]);
    } catch (error) {
      console.error("Unexpected error:", error);
      alert("Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Upload File Metadata</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            File
          </label>
          <input
            type="file"
            accept=".stl,.obj,.png,.jpg"
            onChange={handleFileChange}
            className="mt-1 block w-full border border-gray-300 rounded-md"
          />
        </div>

        {file && type === "STL" && (
          <div className="mt-4">
            <h2 className="text-lg font-medium">3D Preview</h2>
            <STLPreview file={file} />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md"
          >
            <option value="" disabled>
              Select a type
            </option>
            <option value="STL">STL</option>
            <option value="OBJ">OBJ</option>
            <option value="PNG">PNG</option>
            <option value="JPG">JPG</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tags
          </label>
          <div className="mt-2 space-y-2">
            {availableTags.map((tag) => (
              <div key={tag} className="flex items-center">
                <input
                  type="checkbox"
                  id={`tag-${tag}`}
                  value={tag}
                  checked={tags.includes(tag)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setTags([...tags, tag]);
                    } else {
                      setTags(tags.filter((t) => t !== tag));
                    }
                  }}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label
                  htmlFor={`tag-${tag}`}
                  className="ml-2 block text-sm text-gray-700"
                >
                  {tag}
                </label>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {uploading ? "Saving..." : "Save Metadata"}
        </button>
      </form>
    </div>
  );
};

export default UploadPage;
