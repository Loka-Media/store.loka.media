import React, { useState } from 'react';
import { uploadTextAsImage } from '../../../utils/textToImage';
import toast from 'react-hot-toast';

interface TextTabContentProps {
  textContent: string;
  setTextContent: (content: string) => void;
  handleAddTextToDesign: () => void;
  activePlacement: string;
  onTextImageCreated?: (imageUrl: string, filename: string) => Promise<void>;
  userId?: number;
}

const TextTabContent: React.FC<TextTabContentProps> = ({
  textContent,
  setTextContent,
  handleAddTextToDesign,
  activePlacement,
  onTextImageCreated,
  userId = 1
}) => {
  const [fontSize, setFontSize] = useState(48);
  const [fontFamily, setFontFamily] = useState('Arial, sans-serif');
  const [textColor, setTextColor] = useState('#000000');
  const [isConverting, setIsConverting] = useState(false);

  const handleCreateTextImage = async () => {
    if (!textContent.trim()) {
      toast.error('Please enter some text');
      return;
    }

    try {
      setIsConverting(true);
      
      const { url, filename } = await uploadTextAsImage(
        textContent.trim(),
        userId,
        {
          fontSize,
          fontFamily,
          color: textColor,
          backgroundColor: 'transparent',
          textAlign: 'center',
          autoSize: true, // This will make the image exactly fit the text
        }
      );
      
      // Call the callback to add the text image to designs
      await onTextImageCreated?.(url, filename);
      
      toast.success('Text converted to image successfully!');
      setTextContent(''); // Clear the text input
    } catch (error) {
      console.error('Error converting text to image:', error);
      toast.error('Failed to convert text to image');
    } finally {
      setIsConverting(false);
    }
  };
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Add Text</h3>
      
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Text Content</label>
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Enter your text here..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
          <select 
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value={24}>24px</option>
            <option value={32}>32px</option>
            <option value={48}>48px</option>
            <option value={64}>64px</option>
            <option value={72}>72px</option>
            <option value={96}>96px</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Font Family</label>
          <select 
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="Arial, sans-serif">Arial</option>
            <option value="Times New Roman, serif">Times New Roman</option>
            <option value="Helvetica, sans-serif">Helvetica</option>
            <option value="Georgia, serif">Georgia</option>
            <option value="Verdana, sans-serif">Verdana</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
        <input
          type="color"
          value={textColor}
          onChange={(e) => setTextColor(e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-md cursor-pointer"
        />
      </div>

      <button 
        onClick={handleCreateTextImage}
        disabled={!textContent.trim() || isConverting}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isConverting ? 'Converting Text...' : 'Add Text as Image'}
      </button>
    </div>
  );
};

export default TextTabContent;