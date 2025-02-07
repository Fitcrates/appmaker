import React, { useEffect, useState, useRef, useCallback, useLayoutEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { fetchFromAPI } from "../../utils/api";
import { Loader2, ArrowLeft } from "lucide-react";
import { LazyLoad } from "../LazyLoad";

interface Character {
  mal_id: number;
  name: string;
  name_kanji: string;
  about: string;
  images: { jpg: { image_url: string } };
}

interface AnimeAppearance {
  anime: {
    mal_id: number;
    title: string;
    images: { jpg: { image_url: string } };
  };
}

export function CharacterDetails() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [character, setCharacter] = useState<Character | null>(null);
  const [animeAppearances, setAnimeAppearances] = useState<AnimeAppearance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAppearances, setIsLoadingAppearances] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the source anime ID from location state if available
  const sourceAnimeId = location.state?.fromAnimeId;

  console.log('Component rendered with:', { id, sourceAnimeId });

  // Fetch character details
  useEffect(() => {
    const fetchCharacterDetails = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching character details for:', id);
        
        const characterResponse = await fetchFromAPI(`/characters/${id}/full`);
        
        if (!characterResponse.data) {
          throw new Error("Character not found");
        }

        setCharacter(characterResponse.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load character details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharacterDetails();
  }, [id]);

  // Fetch anime appearances
  useEffect(() => {
    const fetchAppearances = async () => {
      if (!id || isLoadingAppearances) {
        console.log('Skipping appearances fetch:', { id, isLoadingAppearances });
        return;
      }

      try {
        console.log('Fetching anime appearances for:', id);
        setIsLoadingAppearances(true);
        const animeResponse = await fetchFromAPI(`/characters/${id}/anime`);
        if (animeResponse?.data) {
          console.log('Received appearances:', animeResponse.data.length);
          setAnimeAppearances(animeResponse.data);
        }
      } catch (err) {
        console.error('Error loading appearances:', err);
      } finally {
        setIsLoadingAppearances(false);
      }
    };

    // Small delay to ensure character data is loaded first
    const timer = setTimeout(() => {
      console.log('Starting appearances fetch after delay');
      fetchAppearances();
    }, 500);

    return () => clearTimeout(timer);
  }, [id, isLoadingAppearances]);

  // Reset state when id changes
  useEffect(() => {
    console.log('ID changed, resetting states');
    setAnimeAppearances([]);
    setIsLoadingAppearances(false);
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  if (error || !character) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        {error || "Character not found"}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 mt-16 px-4 md:px-12 lg:px-24 xl:px-48">
      {/* Back button - show if we have sourceAnimeId or any anime appearances */}
      {(sourceAnimeId || animeAppearances.length > 0) && (
        <Link
          to={`/anime/${sourceAnimeId || animeAppearances[0]?.anime.mal_id}`}
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Anime
        </Link>
      )}

      <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col md:flex-row gap-6 items-start">
        <img 
          src={character.images.jpg.image_url} 
          alt={character.name} 
          className="w-48 h-64 rounded-lg shadow-md object-cover"
          loading="lazy"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-avatar.png';
          }}
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{character.name}</h1>
          {character.name_kanji && (
            <p className="text-gray-500 mt-1">{character.name_kanji}</p>
          )}
          {character.about && (
            <div className="mt-4 text-gray-700 whitespace-pre-line">
              {character.about}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Anime Appearances</h2>
        {isLoadingAppearances ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
          </div>
        ) : animeAppearances.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {animeAppearances.map((appearance) => (
              <Link
                key={appearance.anime.mal_id}
                to={`/anime/${appearance.anime.mal_id}`}
                className="block group"
                loading="lazy"
              >
                <div className="bg-white rounded-lg shadow-sm overflow-hidden transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
                  <img
                    src={appearance.anime.images.jpg.image_url}
                    alt={appearance.anime.title}
                    loading="lazy"
                    className="w-full h-40 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.jpg';
                    }}
                  />
                  <div className="p-3">
                    <h3 className="text-sm font-medium line-clamp-2 group-hover:text-blue-600">
                      {appearance.anime.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 text-center mt-10">
            No anime appearances found
          </div>
        )}
      </div>
    </div>
  );
}
